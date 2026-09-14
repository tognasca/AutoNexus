FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["src/AutoNexus.Api/AutoNexus.Api.csproj", "src/AutoNexus.Api/"]
COPY ["src/AutoNexus.Application/AutoNexus.Application.csproj", "src/AutoNexus.Application/"]
COPY ["src/AutoNexus.Domain/AutoNexus.Domain.csproj", "src/AutoNexus.Domain/"]
COPY ["src/AutoNexus.Infrastructure/AutoNexus.Infrastructure.csproj", "src/AutoNexus.Infrastructure/"]

RUN dotnet restore "src/AutoNexus.Api/AutoNexus.Api.csproj"

COPY . .
WORKDIR "/src/src/AutoNexus.Api"
RUN dotnet build "AutoNexus.Api.csproj" -c Release -o /app/build
RUN dotnet publish "AutoNexus.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "AutoNexus.Api.dll"]
