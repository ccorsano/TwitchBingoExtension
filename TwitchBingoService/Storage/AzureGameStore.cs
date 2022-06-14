using Azure;
using Azure.Data.Tables;
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
        private readonly TableServiceClient _tableClient;
        private readonly string _tablesPrefix;

        public AzureGameStore(IOptions<AzureStorageOptions> storageOptions, ILogger<AzureGameStore> logger)
        {
            _storageOptions = storageOptions.Value;
            _logger = logger;
            _tableClient = new TableServiceClient(_storageOptions.ConnectionString);
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
            var table = _tableClient.GetTableClient(GameTableName);
            var result = await table.UpsertEntityAsync(new BingoGameEntity { Game = bingoGame });
            if (result.Status / 100 != 2)
            {
                throw new Exception("Could not save game to storage");
            }
        }

        public async Task<BingoGame> ReadGame(Guid gameId)
        {
            var table = _tableClient.GetTableClient(GameTableName);
            try
            {
                var result = await table.GetEntityAsync<BingoGameEntity>(gameId.ToString(), "");
                return result.Value.Game;
            } catch(RequestFailedException ex) when (ex.Status == 404)
            {
                _logger.LogError("Bingo game {gameId} not found", gameId);
                return null;
            } catch (RequestFailedException ex) when (ex.Status / 100 != 2)
            {
                throw new Exception($"Could not read game {gameId} from storage");
            }
        }

        public async Task DeleteGame(Guid gameId)
        {
            var table = _tableClient.GetTableClient(GameTableName);
            try
            {
                var result = await table.DeleteEntityAsync(gameId.ToString(), "");
                if (result.IsError)
                {
                    _logger.LogError("Error returned trying to delete game {gameId}", gameId);
                    if (result.Status == 404)
                    {
                        throw new ArgumentOutOfRangeException($"Game to delete {gameId} does not exist in storage");
                    }
                    throw new Exception($"Could not delete game {gameId} from storage  ");
                }
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                throw new ArgumentOutOfRangeException($"Game to delete {gameId} does not exist in storage");
            }
            catch (RequestFailedException ex) when (ex.Status / 100 != 2)
            {
                throw new Exception($"Could not delete game {gameId} from storage ({ex.Status})");
            }
        }

        public async Task<string> ReadUserName(string userId)
        {
            var table = _tableClient.GetTableClient(UserNameTableName);
            try
            {
                var result = await table.GetEntityAsync<BingoUserName>(userId.ToLowerInvariant(), "");
                return result.Value.UserName;
            } catch (RequestFailedException)
            {
                return null;
            }
        }

        public async Task WriteUserName(string userId, string userName)
        {
            var table = _tableClient.GetTableClient(UserNameTableName);
            try
            {
                var entity = new BingoUserName
                {
                    UserId = userId,
                    UserName = userName,
                };
                var result = await table.UpsertEntityAsync(entity);

                if (result.IsError)
                {
                    _logger.LogError("Error saving username to storage ({status}, {reasonPhrase})", result.Status, result.ReasonPhrase);
                    throw new Exception("Could not save username to storage");
                }
            } catch(RequestFailedException ex)
            {
                _logger.LogError(ex, "Error saving username to storage");
                throw new Exception("Could not save username to storage");
            }
        }

        public async Task WriteTentative(Guid gameId, BingoTentative tentative)
        {
            var tentativesTable = _tableClient.GetTableClient(TentativesTableName);
            var pendingTable = _tableClient.GetTableClient(PendingTentativesTableName);

            var userTentativeTask = tentativesTable.UpsertEntityAsync(new BingoTentativeEntity(gameId, tentative.playerId, tentative));
            var pendingTentativeTask = pendingTable.UpsertEntityAsync(new BingoTentativeEntity(gameId, tentative.entryKey, tentative));

            var userTentativeResult = await userTentativeTask;
            if (userTentativeResult.IsError)
            {
                _logger.LogError("Failed to write user tentative for game {gameId}, player {playerId} ({status}, {reasonPhrase})", gameId, tentative.playerId, userTentativeResult.Status, userTentativeResult.ReasonPhrase);
                throw new Exception("Failed to write user tentative");
            }

            var pendingTentativeResult = await pendingTentativeTask;

            if (pendingTentativeResult.IsError)
            {
                _logger.LogError("Failed to write pending tentative for game {gameId}, key {entryKey} ({status}, {reasonPhrase})", gameId, tentative.entryKey, pendingTentativeResult.Status, pendingTentativeResult.ReasonPhrase);
                throw new Exception("Failed to write user tentative");
            }
        }

        public async Task<BingoTentative[]> ReadPendingTentatives(Guid gameId, ushort key, DateTime deletionCutoff)
        {
            var pendingTable = _tableClient.GetTableClient(PendingTentativesTableName);

            try
            {
                var results = pendingTable.QueryAsync<BingoTentativeEntity>(filter: $"PartitionKey eq '{BingoTentativeEntity.TentativePartitionKey(gameId, key)}'");
                var entityList = new List<BingoTentativeEntity>();
                var toBeDeleted = new List<BingoTentativeEntity>();
                await foreach(var result in results)
                {
                    if (result.TentativeTime < deletionCutoff)
                    {
                        toBeDeleted.Add(result);
                    }
                    else
                    {
                        entityList.Add(result);
                    }
                }

                // Delete expired tentatives
                if (toBeDeleted.Count > 0)
                {
                    var batch = new List<TableTransactionAction>();
                    foreach(var entity in toBeDeleted)
                    {
                        batch.Add(new TableTransactionAction(TableTransactionActionType.Delete, entity));
                    }

                    try
                    {
                        await pendingTable.SubmitTransactionAsync(batch);
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
            var tentativesTable = _tableClient.GetTableClient(PendingTentativesTableName);
            try
            {
                var results = tentativesTable.QueryAsync<BingoTentativeEntity>(filter: $"PartitionKey eq '{BingoTentativeEntity.TentativePartitionKey(gameId, playerId)}'");
                var entityList = new List<BingoTentativeEntity>();
                await foreach(var result in results)
                {
                    entityList.Add(result);
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

            var notificationsTable = _tableClient.GetTableClient(NotificationsTableName);
            var entity = new BingoNotificationEntity(gameId, DateTime.UtcNow, notification);
            try
            {
                var result = await notificationsTable.UpsertEntityAsync(entity);
                if (result.Status / 200 != 0)
                {
                    _logger.LogError("Failed to write notification for game {gameId}, key {entryKey}", gameId, key);
                    throw new Exception("Failed to write notification");
                }
            } catch(RequestFailedException ex)
            {
                _logger.LogError(ex, "Failed to write notification for game {gameId}, key {entryKey}", gameId, key);
                throw new Exception("Failed to write notification");
            }
        }

        public async Task<BingoNotification[]> UnqueueNotifications(Guid gameId, ushort key)
        {
            var notificationsTable = _tableClient.GetTableClient(NotificationsTableName);

            try
            {
                var results = notificationsTable.QueryAsync<BingoNotificationEntity>(filter: $"PartitionKey eq '{gameId}'");
                var entityList = new List<BingoNotificationEntity>();
                await foreach (var result in results)
                {
                    entityList.Add(result);
                }

                var batchDelete = new List<TableTransactionAction>();
                foreach (var entity in entityList)
                {
                    batchDelete.Add(new TableTransactionAction(TableTransactionActionType.Delete, entity));
                }
                if (batchDelete.Count > 0)
                {
                    try
                    {
                        await notificationsTable.SubmitTransactionAsync(batchDelete);
                    }
                    catch (RequestFailedException e)
                    {
                        _logger.LogError(e, "Failed to clean expired pending tentatives for game {gameId}, key {entryKey}", gameId, key);
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

            var logTable = _tableClient.GetTableClient(LogTableName);
            var entity = new BingoLogEntity(gameId, entry);
            try
            {
                await logTable.UpsertEntityAsync(entity);
            }
            catch (RequestFailedException e)
            {
                _logger.LogError("Failed to write log for game {gameId}, log {log}", gameId, JsonSerializer.Serialize(entry));
                throw new Exception("Failed to write log");
            }
        }

        public async Task<BingoLogEntry[]> ReadLog(Guid gameId)
        {
            var logTable = _tableClient.GetTableClient(LogTableName);
            try
            {
                var results = logTable.QueryAsync<BingoLogEntity>(filter: $"PartitionKey eq '{gameId}'");

                var entityList = new List<BingoLogEntity>();
                await foreach (var result in results)
                {
                    entityList.Add(result);
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
