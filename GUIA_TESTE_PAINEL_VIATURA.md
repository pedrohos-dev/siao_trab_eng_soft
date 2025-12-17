# 🚔 Guia de Teste - Painel Viatura Interface

## 📋 Visão Geral

O `PainelViaturaInterface` é um componente React que simula o painel de controle de uma viatura policial. Ele permite que os operadores vejam ocorrências designadas, atualizem status e monitorem a localização.

## 🚀 Como Acessar

### 1. Iniciar o Servidor Backend
```bash
cd SIAO-backend
npm start
```

### 2. Iniciar o Frontend
```bash
cd SIAO-frontend
npm run dev
```

### 3. Acessar o Painel
Abra o navegador e acesse:
```
http://localhost:5173/viatura
```

## 🧪 Cenários de Teste

### 1. **Teste de Carregamento Inicial**
- ✅ **Esperado**: Spinner de loading aparece
- ✅ **Esperado**: Dados da viatura VTR-001 são carregados
- ✅ **Esperado**: Status "disponível" é exibido
- ✅ **Esperado**: WebSocket conecta em modo simulação

### 2. **Teste de Geolocalização**
- 🔍 **Ação**: Permitir acesso à localização quando solicitado
- ✅ **Esperado**: Coordenadas aparecem na seção do mapa
- ✅ **Esperado**: Localização é enviada via WebSocket automaticamente

### 3. **Teste de Modo Noturno**
- 🔍 **Ação**: Clicar no botão "Modo Noite"
- ✅ **Esperado**: Interface muda para tema escuro
- ✅ **Esperado**: Botão muda para "Modo Dia"
- 🔍 **Ação**: Clicar novamente
- ✅ **Esperado**: Volta ao tema claro

### 4. **Teste de Ocorrência Ativa**
Para testar com uma ocorrência ativa, modifique temporariamente o mock:

```javascript
// Em viaturaService.js, altere a viatura 1:
{
  id: 1,
  codigo: 'VTR-001',
  tipo: 'Viatura Policial',
  status: 'em_atendimento',
  latitude: -19.9167,
  longitude: -43.9345,
  ultima_atualizacao: '2023-06-15T14:30:00',
  ocorrencia_atual_id: 2, // Adicione esta linha
  equipe: [...]
}
```

- ✅ **Esperado**: Detalhes da ocorrência aparecem
- ✅ **Esperado**: Botões de ação ficam disponíveis

### 5. **Teste de Ações da Ocorrência**
- 🔍 **Ação**: Clicar em "Em Atendimento"
- ✅ **Esperado**: Mensagem WebSocket é enviada
- ✅ **Esperado**: Console mostra a mensagem enviada

- 🔍 **Ação**: Clicar em "Finalizar Atendimento"
- ✅ **Esperado**: Mensagem WebSocket é enviada
- ✅ **Esperado**: Console mostra a mensagem enviada

### 6. **Teste de Conectividade WebSocket**
- 🔍 **Ação**: Abrir DevTools (F12) → Console
- ✅ **Esperado**: Ver mensagens de conexão WebSocket
- ✅ **Esperado**: Status "Online (Simulação)" no header

### 7. **Teste de Erro de Carregamento**
Para simular erro, modifique temporariamente:

```javascript
// Em viaturaService.js, no método obterPorId:
if (isDev && id === 1) {
  throw new Error('Erro simulado'); // Adicione esta linha
  return mockViaturas[0];
}
```

- ✅ **Esperado**: Tela de erro aparece
- ✅ **Esperado**: Botão "Tentar Novamente" funciona

## 🔧 Funcionalidades Testáveis

### ✅ **Funcionais**
1. **Carregamento de dados da viatura**
2. **Exibição de informações da viatura**
3. **Conexão WebSocket em modo simulação**
4. **Geolocalização do navegador**
5. **Alternância de modo noturno/diurno**
6. **Exibição de ocorrências ativas**
7. **Envio de comandos via WebSocket**

### ✅ **Interface**
1. **Layout responsivo**
2. **Temas claro/escuro**
3. **Estados de loading**
4. **Tratamento de erros**
5. **Feedback visual de status**

## 🐛 Problemas Conhecidos e Soluções

### 1. **Geolocalização não funciona**
- **Causa**: Navegador bloqueia geolocalização
- **Solução**: Permitir acesso quando solicitado ou usar HTTPS

### 2. **WebSocket não conecta**
- **Causa**: Backend não está rodando
- **Solução**: Verificar se o servidor está na porta 3000

### 3. **Dados não carregam**
- **Causa**: Serviço mock com problema
- **Solução**: Verificar console para erros

## 📱 Teste em Dispositivos Móveis

### Simulação no DevTools
1. Abrir DevTools (F12)
2. Clicar no ícone de dispositivo móvel
3. Selecionar um dispositivo (ex: iPhone 12)
4. Testar todas as funcionalidades

### Teste Real
1. Conectar dispositivo na mesma rede
2. Acessar `http://[IP_DO_COMPUTADOR]:5173/viatura`
3. Testar geolocalização real
4. Testar orientação (retrato/paisagem)

## 🔍 Monitoramento Durante Testes

### Console do Navegador
Monitore estas mensagens:
```
✅ "Viatura WebSocket conectado"
✅ "Using mock data for viatura 1"
✅ "New Viatura WebSocket message: ..."
✅ Coordenadas de geolocalização
```

### Network Tab
Verifique:
- ✅ Tentativas de conexão WebSocket
- ✅ Requests para dados da viatura
- ✅ Status codes 200 para recursos

## 🎯 Critérios de Sucesso

### ✅ **Básico**
- [ ] Interface carrega sem erros
- [ ] Dados da viatura aparecem
- [ ] WebSocket conecta
- [ ] Modo noturno funciona

### ✅ **Avançado**
- [ ] Geolocalização funciona
- [ ] Ocorrências são exibidas corretamente
- [ ] Ações enviam mensagens WebSocket
- [ ] Interface é responsiva
- [ ] Tratamento de erros funciona

### ✅ **Produção**
- [ ] Performance adequada
- [ ] Sem vazamentos de memória
- [ ] Funciona em diferentes navegadores
- [ ] Acessibilidade básica

## 🚀 Próximos Passos

Após validar o painel básico, você pode:

1. **Integrar mapa real** (Leaflet/Google Maps)
2. **Adicionar notificações push**
3. **Implementar chat com central**
4. **Adicionar histórico de ocorrências**
5. **Melhorar UX mobile**

## 📞 Suporte

Se encontrar problemas:
1. Verificar console do navegador
2. Confirmar que backend está rodando
3. Testar em modo incógnito
4. Limpar cache do navegador

---

**Última atualização**: Dezembro 2024
**Versão**: 1.0.0