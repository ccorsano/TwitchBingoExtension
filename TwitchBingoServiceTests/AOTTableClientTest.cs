using Azure;
using Azure.Data.Tables;
using SoloX.CodeQuality.Test.Helpers.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using TwitchBingoService.Storage;
using Xunit;

namespace TwitchBingoServiceTests
{
    public class AOTTableClientTest
    {

        [Fact]
        public async Task CheckTableClient()
        {
            var httpClient = new HttpClientMockBuilder()
                .WithBaseAddress(new Uri("http://127.0.0.1:10002/devstoreaccount1"))
                .Build();
            AOTTableClient tableClient = new AOTTableClient("UseDevelopmentStorage=true", httpClient);
            TestEntity testEntity = new TestEntity("TestPartitionKey", "TestRowKey");
            await tableClient.InsertOrReplaceAsync("testtable", testEntity, TestEntityContext.Default.TestEntity);
        }
    }
}
