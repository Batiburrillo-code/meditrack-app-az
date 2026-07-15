@description('Región de la base de datos (misma que el AKS)')
param location string = 'centralus'
@description('Nombre del servidor PostgreSQL (globalmente único)')
param pgServerName string
@description('Usuario administrador de PostgreSQL')
param pgAdminUser string
@secure()
@description('Contraseña del administrador de PostgreSQL')
param pgAdminPassword string

resource pg 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: pgServerName
  location: location
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  properties: {
    version: '16'
    administratorLogin: pgAdminUser
    administratorLoginPassword: pgAdminPassword
    storage: { storageSizeGB: 32 }
    highAvailability: { mode: 'Disabled' }
  }
}

resource pgDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: pg
  name: 'db_meditrack'
}

resource pgFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: pg
  name: 'AllowAzureServices'
  properties: { startIpAddress: '0.0.0.0', endIpAddress: '0.0.0.0' }
}

output pgHost string = pg.properties.fullyQualifiedDomainName
