#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:6.0-alpine AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR "/TwitchBingoService"
COPY ["TwitchBingoService.csproj", "."]
RUN dotnet restore "TwitchBingoService.csproj"
COPY . .
WORKDIR "/TwitchBingoService"
RUN dotnet build "TwitchBingoService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "TwitchBingoService.csproj" \
            --configuration Release \ 
            --runtime linux-x64 \
            --self-contained false \ 
            --output /app/publish \
            -p:PublishReadyToRun=true  

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TwitchBingoService.dll"]