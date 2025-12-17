git clone https://github.com/seu-usuario/siao-backend.git
cd siao-backend
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Execute o seed para criar dados iniciais
```bash
npm run seed
```

5. Inicie o servidor
```bash
npm run dev
```

## 📊 Estrutura de Dados

O sistema utiliza arquivos JSON como banco de dados, localizados em `src/data/`:

- `ocorrencias.json` - Ocorrências policiais
- `centralChamadas.json` - Registros de chamadas
- `orgaos.json` - Órgãos de segurança
- `despachos.json` - Despachos de viaturas
- `viaturas.json` - Viaturas policiais
- `geolocalizacao.json` - Posições das viaturas
- `painelViaturas.json` - Status operacional das viaturas
- `usuarios.json` - Usuários do sistema
- `logs.json` - Logs de auditoria

## 🔐 Autenticação

O sistema utiliza JWT (JSON Web Token) para autenticação. Os tokens são gerados no login e devem ser enviados no header `Authorization` em todas as requisições protegidas:

```
Authorization: Bearer <token>
```

## 👥 Usuários de Teste

Após executar o seed, os seguintes usuários estarão disponíveis:

- **Operador Central**: operador@central.gov.br / senha123
- **Policial PMMG**: silva@pmmg.gov.br / senha123
- **Delegado DHPP**: costa@dhpp.gov.br / senha123
- **Policial Viatura**: viatura01@pmmg.gov.br / senha123
- **Administrador**: admin@siao.gov.br / senha123

## 📡 WebSocket

O sistema utiliza Socket.io para comunicação em tempo real. Para se conectar:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'seu-jwt-token'
  }
});

// Eventos disponíveis
socket.on('nova-ocorrencia', (data) => console.log('Nova ocorrência:', data));
socket.on('despacho-enviado', (data) => console.log('Despacho enviado:', data));
socket.on('status-atualizado', (data) => console.log('Status atualizado:', data));
socket.on('posicao-viatura', (data) => console.log('Posição atualizada:', data));