using Azure;
using Azure.Data.Tables;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using TwitchBingoService.Configuration;
using TwitchBingoService.Model;
using TwitchBingoService.Storage.Azure;

namespace TwitchBingoService.Storage
{
    public class AzureGameStore : IGameStorage
    {
        private readonly AzureStorageOptions _storageOptions;
        private readonly ILogger _logger;
        private readonly TableServiceClient _storageAccount;
        private readonly string _tablesPrefix;

        public AzureGameStore(IOptions<AzureStorageOptions> storageOptions, ILogger<AzureGameStore> logger)
        {
            _storageOptions = storageOptions.Value;
            _logger = logger;
            _storageAccount = new TableServiceClient(_storageOptions.ConnectionString);
            _tablesPrefix = _storageOptions.Prefix.ToLowerInvariant() ?? "";

            // TODO: move storage init to an external function with tighter security
            //var client = _storageAccount.CreateCloudTableClient();
            //var gameTable = client.GetTableReference(GameTableName);
            //gameTable.CreateIfNotExists();
            //var userTable = client.GetTableReference(UserNameTableName);
            //userTable.CreateIfNotExists();
            //var tentativesTable = client.GetTableReference(TentativesTableName);
            //tentativesTable.CreateIfNotExists();
            //var pendingTentativesTable = client.GetTableReference(PendingTentativesTableName);
            //pendingTentativesTable.CreateIfNotExists();
            //var notificationsTable = client.GetTableReference(NotificationsTableName);
            //notificationsTable.CreateIfNotExists();
        }

        private string GameTableName => $"{_tablesPrefix}game";
        private string UserNameTableName => $"{_tablesPrefix}username";
        private string TentativesTableName => $"{_tablesPrefix}tentatives";
        private string PendingTentativesTableName => $"{_tablesPrefix}pendingtentatives";
        private string NotificationsTableName => $"{_tablesPrefix}notifications";
        private string LogTableName => $"{_tablesPrefix}log";

        public async Task WriteGame(BingoGame bingoGame)
        {
            var client = _storageAccount.GetTableClient(GameTableName);
            var entity = new BingoGameEntity(bingoGame);
            Response result;
            ETag? etagValue = (ETag?)bingoGame.StorageObject;
            if (etagValue.HasValue)
            {
                try
                {
                    result = await client.UpdateEntityAsync(entity, etagValue.Value, TableUpdateMode.Replace);
                } catch (RequestFailedException ex) when (ex.Status == 412)
                {
                    throw new ConcurrentGameUpdateException();
                }
            }
            else
            {
                result = await client.AddEntityAsync(entity);
            }
            if (result.IsError)
            {
                throw new Exception("Could not save game to storage");
            }
            bingoGame.StorageObject = result.Headers.ETag;
        }

        public async Task<BingoGame> ReadGame(Guid gameId)
        {
            var client = _storageAccount.GetTableClient(GameTableName);
            var result = await client.GetEntityIfExistsAsync<BingoGameEntity>(gameId.ToString(), "");
            if (! result.HasValue)
            {
                _logger.LogError("Bingo game {gameId} not found", gameId);
                return null;
            }
            if (result.GetRawResponse().IsError)
            {
                throw new Exception($"Could not read game {gameId} from storage");
            }
            result.Value.Game.StorageObject = result.GetRawResponse().Headers.ETag;
            return result.Value.Game;
        }

        public async Task DeleteGame(Guid gameId)
        {
            var client = _storageAccount.GetTableClient(GameTableName);
            var result = await client.GetEntityIfExistsAsync<BingoGameEntity>(gameId.ToString(), "");
            if (! result.HasValue)
            {
                throw new ArgumentOutOfRangeException($"Game to delete {gameId} does not exist in storage");
            }
            if (result.GetRawResponse().IsError)
            {
                throw new Exception($"Could not fetch game {gameId} for deletion ({result.GetRawResponse().Status})");
            }
            var delete = await client.DeleteEntityAsync(result.Value.PartitionKey, result.Value.RowKey, result.Value.ETag);
            if (delete.IsError)
            {
                throw new Exception($"Could not delete game {gameId} from storage ({delete.Status})");
            }
        }

        public async Task<string> ReadUserName(string userId)
        {
            var client = _storageAccount.GetTableClient(UserNameTableName);
            var result = await client.GetEntityIfExistsAsync<BingoUserName>(userId.ToLowerInvariant(), "");
            if (! result.HasValue)
            {
                return null;
            }
            return result.Value.UserName;
        }

        public async Task WriteUserName(string userId, string userName)
        {
            var client = _storageAccount.GetTableClient(UserNameTableName);
            var result = await client.UpsertEntityAsync(new BingoUserName(userId, userName));
            if (result.IsError)
            {
                throw new Exception("Could not save username to storage");
            }
        }

        public async Task WriteTentative(Guid gameId, BingoTentative tentative)
        {
            var userTentativeTable = _storageAccount.GetTableClient(TentativesTableName);
            var pendingTentativeTable = _storageAccount.GetTableClient(PendingTentativesTableName);
            var userTask = userTentativeTable.AddEntityAsync(new BingoTentativeEntity(gameId, tentative.playerId, tentative));
            var pendingTask = pendingTentativeTable.AddEntityAsync(new BingoTentativeEntity(gameId, tentative.entryKey, tentative));
            var result = await userTask;
            if (result.IsError)
            {
                _logger.LogError("Failed to write user tentative for game {gameId}, player {playerId}", gameId, tentative.playerId);
                throw new Exception("Failed to write user tentative");
            }
            result = await pendingTask;
            if (result.IsError)
            {
                _logger.LogError("Failed to write pending tentative for game {gameId}, key {entryKey}", gameId, tentative.entryKey);
                throw new Exception("Failed to write user tentative");
            }
        }

        public async Task<BingoTentative[]> ReadPendingTentatives(Guid gameId, ushort key, DateTime deletionCutoff)
        {
            var client = _storageAccount.GetTableClient(PendingTentativesTableName);
            try
            {
                var query = TableClient.CreateQueryFilter($"PartitionKey eq {BingoTentativeEntity.TentativePartitionKey(gameId, key)}");

                var entityList = new List<BingoTentativeEntity>();
                var toBeDeleted = new List<BingoTentativeEntity>();

                await foreach(var entity in client.QueryAsync<BingoTentativeEntity>(query))
                {
                    if (entity.TentativeTime < deletionCutoff)
                    {
                        toBeDeleted.Add(entity);
                    }
                    else
                    {
                        entityList.Add(entity);
                    }
                }

                // Delete expired tentatives
                if (toBeDeleted.Count > 0)
                {
                    try
                    {
                        await client.SubmitTransactionAsync(toBeDeleted.Select(e => new TableTransactionAction(TableTransactionActionType.Delete, e))); ;
                    } catch(RequestFailedException e)
                    {
                        _logger.LogError(e, "Failed to clean expired pending tentatives for game {gameId}, key {entryKey}", gameId, key);
                    }
                }

                return entityList.Select(e => e.ToTentative()).ToArray();
            }
            catch (RequestFailedException e)
            {
                _logger.LogError(e, "Failed to read pending tentatives for game {gameId}, key {entryKey}", gameId, key);
                throw;
            }
        }

        public async Task<BingoTentative[]> ReadTentatives(Guid gameId, string playerId)
        {
            var client = _storageAccount.GetTableClient(TentativesTableName);
            try
            {
                var query = TableClient.CreateQueryFilter($"PartitionKey eq {BingoTentativeEntity.TentativePartitionKey(gameId, playerId)}");

                var entityList = new List<BingoTentativeEntity>();

                await foreach(var tentative in client.QueryAsync<BingoTentativeEntity>(query))
                {
                    entityList.Add(tentative);
                }

                return entityList.Select(e => e.ToTentative()).ToArray();
            }
            catch (RequestFailedException e)
            {
                _logger.LogError(e, "Failed to read tentatives for game {gameId}, player {playerId}", gameId, playerId);
                throw;
            }
        }

        public async Task QueueNotification(Guid gameId, ushort key, BingoNotification notification)
        {
            _logger.LogInformation($"Queue: {gameId}, {key}, {notification.playerId}");

            var client = _storageAccount.GetTableClient(NotificationsTableName);
            var entity = new BingoNotificationEntity(gameId, DateTime.UtcNow, notification);

            var result = await client.AddEntityAsync(entity);
            if (result.IsError)
            {
                _logger.LogError("Failed to write notification for game {gameId}, key {entryKey}", gameId, key);
                throw new Exception("Failed to write notification");
            }
        }

        public async Task<BingoNotification[]> UnqueueNotifications(Guid gameId, ushort key)
        {
            var client = _storageAccount.GetTableClient(NotificationsTableName);
            try
            {
                // Note: The ToString here is important, as the FormattableString will read the typed argument and we can get a type mismatch in the query
                var query = TableClient.CreateQueryFilter($"PartitionKey eq {gameId.ToString()}");

                var entityList = new List<BingoNotificationEntity>();
                await foreach(var entity in client.QueryAsync<BingoNotificationEntity>(query))
                {
                    entityList.Add(entity);
                }

                if (entityList.Any())
                {
                    try
                    {
                        await client.SubmitTransactionAsync(entityList.Select(e => new TableTransactionAction(TableTransactionActionType.Delete, e)));
                    }
                    catch (RequestFailedException ex)
                    {
                        _logger.LogError(ex, "Failed to cleanup retrieved notifications for game {gameId} key {key}", gameId, key);
                    }
                }

                return entityList.Select(e => e.ToNotification()).ToArray();
            }
            catch (RequestFailedException e)
            {
                _logger.LogError(e, "Failed to read tentatives for game {gameId}, key {key}", gameId, key);
                throw;
            }
        }

        public async Task WriteLog(Guid gameId, BingoLogEntry entry)
        {
            _logger.LogInformation($"Log: {gameId}, {entry.key}, {entry.type}");

            var client = _storageAccount.GetTableClient(LogTableName);
            var entity = new BingoLogEntity(gameId, entry);

            var result = await client.AddEntityAsync(entity);
            if (result.IsError)
            {
                _logger.LogError("Failed to write log for game {gameId}, log {log}", gameId, JsonSerializer.Serialize(entry));
                throw new Exception("Failed to write log");
            }
        }

        public async Task<BingoLogEntry[]> ReadLog(Guid gameId)
        {
            var client = _storageAccount.GetTableClient(LogTableName);
            try
            {
                // Note: The ToString here is important, as the FormattableString will read the typed argument and we can get a type mismatch in the query
                var query = TableClient.CreateQueryFilter($"PartitionKey eq {gameId.ToString()}");

                var entityList = new List<BingoLogEntity>();
                await foreach(var entity in client.QueryAsync<BingoLogEntity>(query))
                {
                    entityList.Add(entity);
                }

                return entityList.Select(e => e.ToLogEntry()).ToArray();
            }
            catch (RequestFailedException e)
            {
                _logger.LogError(e, "Failed to read logs for game {gameId}", gameId);
                throw;
            }
        }
    }
}
