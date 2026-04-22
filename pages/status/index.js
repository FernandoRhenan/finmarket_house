import useSWR from 'swr'

async function fetchAPI(key) {
  const response = await fetch(key)
  const responseBody = await response.json()
  return responseBody
}

function StatusPage() {
  return (
    <div>
      <h1>StatusPage</h1>
      <UpdatedAt />
      <DatabaseStatus />
    </div>
  )
}

export default StatusPage

function UpdatedAt() {
  const { isLoading, data } = useSWR('/api/v1/status', fetchAPI, {
    refreshInterval: 5000,
  })

  let updatedAt = 'Carregando...'

  if (!isLoading && data) {
    updatedAt = new Date(data.updated_at).toLocaleString('pt-BR')
  }

  return (
    <div>
      <span>Última atualização: {updatedAt}</span>
    </div>
  )
}

function DatabaseStatus() {
  const { isLoading, data } = useSWR('/api/v1/status', fetchAPI, {
    refreshInterval: 5000,
  })

  let databaseVersion = 'Carregando...'
  let maxConnections = 'Carregando...'
  let currentConnections = 'Carregando...'

  if (!isLoading && data) {
    databaseVersion = data.dependencies.database.database_version
    maxConnections = data.dependencies.database.max_connections
    currentConnections = data.dependencies.database.current_connections
  }

  return (
    <div>
      <details>
        <summary>Banco de dados:</summary>
        <div>
          <span>Versão do banco de dados: {databaseVersion}</span>
        </div>
        <div>
          <span>Conexões máximas: {maxConnections}</span>
        </div>
        <div>
          <span>Conexões atuais: {currentConnections}</span>
        </div>
      </details>
    </div>
  )
}
