using Microsoft.Azure.Cosmos.Table;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
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
        private readonly CloudStorageAccount _storageAccount;
        private readonly string _tablesPrefix;

        public AzureGameStore(IOptions<AzureStorageOptions> storageOptions, ILogger<AzureGameStore> logger)
        {
            _storageOptions = storageOptions.Value;
            _logger = logger;
            _storageAccount = CloudStorageAccount.Parse(_storageOptions.ConnectionString);
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

        public async Task WriteGame(BingoGame bingoGame)
        {
            var client = _storageAccount.CreateCloudTableClient();
            var table = client.GetTableReference(GameTableName);
            var insert = TableOperation.InsertOrReplace(new BingoGameEntity(bingoGame));
            var result = await table.ExecuteAsync(insert);
            if (result.HttpStatusCode / 100 != 2)
            {
                throw new Exception("Could not save game to storage");
            }
        }

        public async Task<BingoGame> ReadGame(Guid gameId)
        {
            var client = _storageAccount.CreateCloudTableClient();
            var table = client.GetTableReference(GameTableName);
            var retrieve = TableOperation.Retrieve<BingoGameEntity>(gameId.ToString(), "");
            var result = await table.ExecuteAsync(retrieve);
            if (result.HttpStatusCode == 404)
            {
                _logger.LogError("Bingo game {gameId} not found", gameId);
                return null;
            }
            if (result.HttpStatusCode / 100 != 2)
            {
                throw new Exception($"Could not read game {gameId} from storage");
            }
            return (result.Result as BingoGameEntity).Game;
        }

        public async Task DeleteGame(Guid gameId)
        {
            var client = _storageAccount.CreateCloudTableClient();
            var table = client.GetTableReference(GameTableName);
            var retrieve = TableOperation.Retrieve<BingoGameEntity>(gameId.ToString(), "");
            var result = await table.ExecuteAsync(retrieve);
            if (result.HttpStatusCode == 404)
            {
                throw new ArgumentOutOfRangeException($"Game to delete {gameId} does not exist in storage");
            }
            if (result.HttpStatusCode / 100 != 2)
            {
                throw new Exception($"Could not fetch game { gameId } for deletion ({result.HttpStatusCode})");
            }
            var delete = TableOperation.Delete(result.Result as BingoGameEntity);
            result = await table.ExecuteAsync(delete);
            if (result.HttpStatusCode / 100 != 2)
            {
                throw new Exception($"Could not delete game {gameId} from storage ({result.HttpStatusCode})");
            }
        }

        public async Task<string> ReadUserName(string userId)
        {
            var client = _storageAccount.CreateCloudTableClient();
            var table = client.GetTableReference(UserNameTableName);
            var retrieve = TableOperation.Retrieve<BingoUserName>(userId.ToLowerInvariant(), "");
            var result = await table.ExecuteAsync(retrieve);
            if (result.HttpStatusCode / 100 != 2)
            {
                return null;
            }
            return (result.Result as BingoUserName).UserName;
        }

        public async Task WriteUserName(string userId, string userName)
        {
            var client = _storageAccount.CreateCloudTableClient();
            var table = client.GetTableReference(UserNameTableName);
            var insert = TableOperation.InsertOrReplace(new BingoUserName(userId, userName));
            var result = await table.ExecuteAsync(insert);
            if (result.HttpStatusCode / 100 != 2)
            {
                throw new Exception("Could not save username to storage");
            }
        }

        public async Task WriteTentative(Guid gameId, BingoTentative tentative)
        {
            var client = _storageAccount.CreateCloudTableClient();
            var userTentativeTable = client.GetTableReference(TentativesTableName);
            var pendingTentativeTable = client.GetTableReference(PendingTentativesTableName);
            var userTentative = TableOperation.InsertOrReplace(new BingoTentativeEntity(gameId, tentative.playerId, tentative));
            var pendingTentative = TableOperation.InsertOrReplace(new BingoTentativeEntity(gameId, tentative.entryKey, tentative));
            var userTask = userTentativeTable.ExecuteAsync(userTentative);
            var pendingTask = pendingTentativeTable.ExecuteAsync(pendingTentative);
            var result = await userTask;
            if (result.HttpStatusCode / 100 != 2)
            {
                _logger.LogError("Failed to write user tentative for game {gameId}, player {playerId}", gameId, tentative.playerId);
                throw new Exception("Failed to write user tentative");
            }
            result = await pendingTask;
            if (result.HttpStatusCode / 100 != 2)
            {
                _logger.LogError("Failed to write pending tentative for game {gameId}, key {entryKey}", gameId, tentative.entryKey);
                throw new Exception("Failed to write user tentative");
            }
        }

        public async Task<BingoTentative[]> ReadPendingTentatives(Guid gameId, ushort key)
        {
            var client = _storageAccount.CreateCloudTableClient();
            var table = client.GetTableReference(PendingTentativesTableName);
            try
            {
                var query = new TableQuery<BingoTentativeEntity>();
                query.FilterString = TableQuery.GenerateFilterCondition("PartitionKey", "eq", BingoTentativeEntity.TentativePartitionKey(gameId, key));

                TableQuerySegment<BingoTentativeEntity> querySegment = null;
                var entityList = new List<BingoTentativeEntity>();
                while (querySegment == null || querySegment.ContinuationToken != null)
                {
                    querySegment = await table.ExecuteQuerySegmentedAsync(query, querySegment != null ?
                                                     querySegment.ContinuationToken : null);
                    entityList.AddRange(querySegment);
                }

                return entityList.Select(e => e.ToTentative()).ToArray();
            }
            catch (StorageException e)
            {
                _logger.LogError(e, "Failed to read pending tentatives for game {gameId}, key {entryKey}", gameId, key);
                throw;
            }
        }

        public async Task<BingoTentative[]> ReadTentatives(Guid gameId, string playerId)
        {
            var client = _storageAccount.CreateCloudTableClient();
            var table = client.GetTableReference(TentativesTableName);
            try
            {
                var query = new TableQuery<BingoTentativeEntity>();
                query.FilterString = TableQuery.GenerateFilterCondition("PartitionKey", "eq", BingoTentativeEntity.TentativePartitionKey(gameId, playerId));

                TableQuerySegment<BingoTentativeEntity> querySegment = null;
                var entityList = new List<BingoTentativeEntity>();
                while (querySegment == null || querySegment.ContinuationToken != null)
                {
                    querySegment = await table.ExecuteQuerySegmentedAsync(query, querySegment != null ?
                                                     querySegment.ContinuationToken : null);
                    entityList.AddRange(querySegment);
                }

                return entityList.Select(e => e.ToTentative()).ToArray();
            }
            catch (StorageException e)
            {
                _logger.LogError(e, "Failed to read tentatives for game {gameId}, player {playerId}", gameId, playerId);
                throw;
            }
        }

        public async Task QueueNotification(Guid gameId, ushort key, BingoNotification notification)
        {
            _logger.LogInformation($"Queue: {gameId}, {key}, {notification.playerId}");

            var client = _storageAccount.CreateCloudTableClient();
            var table = client.GetTableReference(NotificationsTableName);
            var entity = new BingoNotificationEntity(gameId, DateTime.UtcNow, notification);
            var notificationInsert = TableOperation.InsertOrReplace(entity);

            var result = await table.ExecuteAsync(notificationInsert);
            if (result.HttpStatusCode / 100 != 2)
            {
                _logger.LogError("Failed to write notification for game {gameId}, key {entryKey}", gameId, key);
                throw new Exception("Failed to write notification");
            }
        }

        public async Task<BingoNotification[]> UnqueueNotifications(Guid gameId, ushort key)
        {
            var client = _storageAccount.CreateCloudTableClient();
            var table = client.GetTableReference(NotificationsTableName);
            try
            {
                var query = new TableQuery<BingoNotificationEntity>();
                query.FilterString = TableQuery.GenerateFilterCondition("PartitionKey", "eq", gameId.ToString());

                TableQuerySegment<BingoNotificationEntity> querySegment = null;
                var entityList = new List<BingoNotificationEntity>();
                while (querySegment == null || querySegment.ContinuationToken != null)
                {
                    querySegment = await table.ExecuteQuerySegmentedAsync(query, querySegment != null ?
                                                     querySegment.ContinuationToken : null);
                    entityList.AddRange(querySegment);
                }

                var batchDelete = new TableBatchOperation();
                foreach(var entity in entityList)
                {
                    batchDelete.Add(TableOperation.Delete(entity));
                }
                if (batchDelete.Count > 0)
                {
                    try
                    {
                        await table.ExecuteBatchAsync(batchDelete);
                    }
                    catch (StorageException ex)
                    {
                        _logger.LogError(ex, "Failed to cleanup retrieved notifications for game {gameId} key {key}", gameId, key);
                    }
                }

                return entityList.Select(e => e.ToNotification()).ToArray();
            }
            catch (StorageException e)
            {
                _logger.LogError(e, "Failed to read tentatives for game {gameId}, key {key}", gameId, key);
                throw;
            }
        }
    }
}
