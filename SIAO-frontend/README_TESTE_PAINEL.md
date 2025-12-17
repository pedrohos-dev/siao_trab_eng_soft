# 🚔 Teste do Painel Viatura - Guia Rápido

## 🚀 Como Testar

### 1. **Acesso Básico**
```
http://localhost:5173/viatura
```
Interface limpa para uso em produção

### 2. **Acesso com Painel de Teste**
```
http://localhost:5173/viatura/teste
```
Interface com painel lateral de testes (recomendado para desenvolvimento)

## 🧪 Funcionalidades de Teste

### **Painel de Teste Lateral**
- 🚨 **Nova Ocorrência**: Simula recebimento de nova ocorrência
- 🔄 **Em Andamento**: Simula mudança de status para "em andamento"
- ✅ **Encerrar**: Simula finalização da ocorrência
- 📍 **Geolocalização**: Simula nova posição GPS
- ❌ **Erro Conexão**: Simula perda de conexão
- 🚀 **Teste Automático**: Executa sequência completa de testes

### **Console do Navegador**
Abra o DevTools (F12) e use:
```javascript
// Executar todos os testes
PainelViaturaTest.executarTestesAutomaticos()

// Simular nova ocorrência
PainelViaturaTest.simularNovaOcorrencia()

// Verificar estado atual
PainelViaturaTest.verificarEstado()

// Gerar relatório
PainelViaturaTest.gerarRelatorioTeste()
```

## ✅ Checklist de Teste

### **Carregamento Inicial**
- [ ] Spinner aparece durante carregamento
- [ ] Dados da viatura VTR-001 carregam
- [ ] Status "disponível" é exibido
- [ ] WebSocket conecta em modo simulação
- [ ] Botão "Modo Noite" funciona

### **Geolocalização**
- [ ] Solicita permissão de localização
- [ ] Exibe coordenadas no mapa
- [ ] Atualiza posição automaticamente
- [ ] Envia dados via WebSocket

### **Ocorrências**
- [ ] Exibe "Nenhuma ocorrência designada" inicialmente
- [ ] Recebe nova ocorrência via simulação
- [ ] Mostra detalhes da ocorrência
- [ ] Botões de ação funcionam
- [ ] Envia comandos via WebSocket

### **Interface**
- [ ] Layout responsivo
- [ ] Modo noturno/diurno
- [ ] Status de conexão visível
- [ ] Tratamento de erros

## 🔧 Dados de Teste

### **Viatura Mock**
```javascript
{
  id: 1,
  codigo: 'VTR-001',
  tipo: 'Viatura Policial',
  status: 'disponivel',
  latitude: -19.9167,
  longitude: -43.9345,
  equipe: [
    { nome: 'Policial Silva', funcao: 'Motorista' },
    { nome: 'Policial Oliveira', funcao: 'Comandante' }
  ]
}
```

### **Ocorrência Mock**
```javascript
{
  id: 2,
  tipo: 'Furto',
  descricao: 'Furto de celular em estabelecimento comercial',
  endereco: 'Rua Secundária, 500',
  status: 'em_andamento',
  prioridade: 'media'
}
```

## 🐛 Solução de Problemas

### **Interface não carrega**
1. Verificar se o servidor está rodando
2. Limpar cache do navegador
3. Verificar console para erros

### **WebSocket não conecta**
1. Confirmar backend na porta 3000
2. Verificar firewall/antivírus
3. Usar modo simulação (automático em dev)

### **Geolocalização não funciona**
1. Permitir acesso quando solicitado
2. Usar HTTPS em produção
3. Testar em navegador diferente

### **Dados não aparecem**
1. Verificar console para erros
2. Confirmar serviços mock
3. Recarregar página

## 📱 Teste Mobile

### **Simulação no DevTools**
1. F12 → Toggle device toolbar
2. Selecionar dispositivo móvel
3. Testar todas as funcionalidades
4. Verificar orientação retrato/paisagem

### **Dispositivo Real**
1. Conectar na mesma rede WiFi
2. Acessar `http://[IP]:5173/viatura/teste`
3. Testar geolocalização real
4. Verificar performance

## 📊 Métricas de Performance

### **Carregamento**
- Tempo inicial: < 2s
- Primeira interação: < 1s
- WebSocket conecta: < 3s

### **Responsividade**
- Clique em botão: < 100ms
- Mudança de tema: < 200ms
- Atualização de dados: < 500ms

## 🎯 Próximos Testes

1. **Integração com backend real**
2. **Teste de stress (múltiplas ocorrências)**
3. **Teste de conectividade intermitente**
4. **Teste de bateria (mobile)**
5. **Teste de acessibilidade**

---

**Dica**: Use `/viatura/teste` durante desenvolvimento e `/viatura` para demonstrações!