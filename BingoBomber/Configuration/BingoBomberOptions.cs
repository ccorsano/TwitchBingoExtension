using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BingoBomber.Configuration
{
    public class BingoBomberOptions
    {
        public string TargetService { get; set; } = "https://localhost:5001";
        public string ChannelId { get; set; } = "265737932";
    }
}
