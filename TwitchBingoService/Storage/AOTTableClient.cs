using Azure.Data.Tables;
using System;
using System.Collections.Concurrent;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;
using System.Threading.Tasks;

namespace TwitchBingoService.Storage
{
    public class AOTTableClient
    {
        private readonly HttpClient _http;
        private readonly string _accountName;
        private readonly byte[] _accountKey;
        private readonly Uri _baseUri;

        public AOTTableClient(string connectionString, HttpClient http)
        {
            _http = http;
            string[] segments = connectionString.Split(';');

            foreach (var segment in segments)
            {
                string[] kvp = segment.Split('=', 2);

                switch (kvp[0])
                {
                    case "UseDevelopmentStorage":
                        _accountName = "devstoreaccount1";
                        _accountKey = Convert.FromBase64String("Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==");
                        _baseUri = new Uri("http://127.0.0.1:10002/devstoreaccount1");
                        break;
                    case "AccountName":
                        _accountName = kvp[1];
                        break;
                    case "AccountKey":
                        _accountKey = Convert.FromBase64String(kvp[1]);
                        break;
                    case "TableEndpoint":
                        if (Uri.TryCreate(kvp[1], UriKind.Absolute, out Uri? baseUri))
                        {
                            _baseUri = baseUri!;
                        }
                        else
                        {
                            throw new FormatException("TableEndpoint");
                        }
                        break;
                    case "DefaultEndpointsProtocol":
                        // usually "https", we ignore unless TableEndpoint missing
                        if (kvp[1] != "https") throw new NotSupportedException("Only https is supported");
                        break;
                    default:
                        break;
                }
            }

            if (string.IsNullOrEmpty(_accountName))
            {
                throw new ArgumentNullException("AccountName");
            }
            if (_accountKey == null)
            {
                throw new ArgumentNullException("AccountKey");
            }
        }

        public AOTTableClient(string accountName, string accountKey, string tableEndpoint, HttpClient httpClient)
        {
            _accountName = accountName;
            _http = httpClient;
            _accountKey = Convert.FromBase64String(accountKey);
            _baseUri = new Uri(tableEndpoint.TrimEnd('/') + "/");

        }

        private string BuildAuthHeader(string method, string resource, string date, string contentMd5 = "")
        {
            // Shared Key Lite: "VERB\nContent-MD5\nContent-Type\nDate\n/{account}/{resource}"
            var stringToSign = $"{method}\n{contentMd5}\napplication/json\n{date}\n/{_accountName}/{resource}";
            using var hmac = new HMACSHA256(_accountKey);
            var signature = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(stringToSign)));
            return $"SharedKeyLite {_accountName}:{signature}";
        }

        private async Task<HttpResponseMessage> SendAsync<T>(HttpMethod method, string table, string resource, T? payload = null, JsonTypeInfo<T>? jsonTypeInfo = null)
            where T : class, ITableEntity
        {
            var uri = new Uri(_baseUri, $"{table}{resource}");
            var date = DateTime.UtcNow.ToString("R");

            HttpRequestMessage request = new(method, uri);
            request.Headers.Add("x-ms-date", date);
            request.Headers.Add("x-ms-version", "2019-02-02"); // stable version for Table API
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            string body = "";
            if (payload != null)
            {
                body = JsonSerializer.Serialize(payload, jsonTypeInfo!);
                request.Content = new StringContent(body, Encoding.UTF8, "application/json");
            }

            var resourcePath = $"{table}{resource}";
            request.Headers.Authorization = AuthenticationHeaderValue.Parse(
                BuildAuthHeader(method.Method, resourcePath, date)
            );

            return await _http.SendAsync(request);
        }

        public async Task InsertOrReplaceAsync<T>(string table, T? entity, JsonTypeInfo<T> jsonTypeInfo)
            where T : class, ITableEntity
        {
            
            HttpResponseMessage res = await SendAsync(HttpMethod.Post, table, "", entity, jsonTypeInfo);
            res.EnsureSuccessStatusCode();
        }

        public async Task DeleteEntityAsync<T>(string table, string partitionKey, string rowKey, string etag)
            where T : class, ITableEntity
        {
            string resource = $"(PartitionKey='{Uri.EscapeDataString(partitionKey)}',RowKey='{Uri.EscapeDataString(rowKey)}')";
            var res = await SendAsync<T>(HttpMethod.Delete, table, resource, null, null);
            res.EnsureSuccessStatusCode();
        }

    }
}
