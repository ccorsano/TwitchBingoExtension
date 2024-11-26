using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchBingoService.Controllers
{
    [Route("/config")]
    public class ConfigurationController : Controller
    {
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
    }
}
