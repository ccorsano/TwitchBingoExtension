using Orleans;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BingoGrainInterfaces
{
    public interface IBingoGameObserver : IGrainObserver
    {
        Task OnConfirmed(ushort key, DateTime confirmedAt, string confirmedBy);
    }
}
