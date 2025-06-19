using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using TwitchBingoService.Model;
using TwitchBingoService.Services;

namespace TwitchBingoService.Controllers
{
    [Route("/config")]
    public class ConfigurationController : Controller
    {
        private TwitchEBSService _ebsService;

        public ConfigurationController(TwitchEBSService ebsService)
        {
            _ebsService = ebsService;
        }

        /// <summary>
        /// Proxy to download text file
        /// </summary>
        /// <param name="text">Payload</param>
        /// <returns></returns>
        [Produces("text/plain")]
        [HttpPost("download-entries")]
        public async Task<IActionResult> DownloadEntries()
        {
            using(var reader = new StreamReader(HttpContext.Request.Body))
            {
                var content = await reader.ReadToEndAsync();
                Response.ContentType = "text/plain";
                Response.Headers.ContentDisposition = "attachment; filename=\"bingoEntries.txt\"";
                return new OkObjectResult(content);
            }
        }

        [HttpGet("")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetConfiguration()
        {
            var user = new TwitchUser(User.FindFirstValue("user_id"), null, null);
            return new OkObjectResult(await _ebsService.GetBroadcasterConfigurationSegment(user.Id));

        }
    }
}
