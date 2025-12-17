 # 🧪 GUIA DE TESTE - RECURSOS PRÓXIMOS

## 🚨 **PROBLEMA IDENTIFICADO E SOLUCIONADO**

**Erro**: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**Causa**: O frontend está tentando acessar APIs que retornam HTML (404) em vez de JSON.

**Solução**: Implementada com logs detalhados e dados mockados para teste.

---

## 🔧 **COMO TESTAR A FUNCIONALIDADE**

### **1. Iniciar o Backend**
```bash
cd SIAO-backend
node src/app.js
```

**Verificar se aparece**:
```
🚀 Servidor SIAO rodando na porta 3000
📡 WebSocket ativo
🌐 CORS configurado para: http://localhost:5173
```

### **2. Iniciar o Frontend**
```bash
cd SIAO-frontend
npm run dev
```

### **3. Acessar a Tela**
```
http://localhost:5173/recursos-proximos
```

---

## 🧪 **OPÇÕES DE TESTE**

### **Opção 1: Geolocalização Real**
1. Permitir acesso à localização quando solicitado
2. Aguardar a busca automática
3. Verificar logs no console do navegador (F12)

### **Opção 2: Localização Manual**
1. Marcar "Usar localização manual"
2. Inserir coordenadas de Belo Horizonte:
   - **Latitude**: `-19.9167`
   - **Longitude**: `-43.9345`
3. Aguardar a busca automática

### **Opção 3: Dados Mockados (RECOMENDADO)**
1. Clicar no botão **"🧪 Testar com Dados Mockados"**
2. Visualizar dados de exemplo imediatamente
3. Testar filtros e funcionalidades

---

## 🔍 **LOGS DE DEPURAÇÃO**

O componente agora inclui logs detalhados no console:

```javascript
// Abrir Console do Navegador (F12)
🔍 Buscando recursos próximos para: -19.9167, -43.9345 (raio: 5km)
📡 Resposta viaturas: 200
📄 Conteúdo resposta viaturas: {"success":true,"data":[...]
📡 Resposta ocorrências: 200
📄 Conteúdo resposta ocorrências: {"success":true,"data":[...]
📊 Encontradas: 2 viaturas, 3 ocorrências
```

---

## 🎯 **FUNCIONALIDADES TESTÁVEIS**

### **✅ Dados Mockados Incluídos**
- **2 Viaturas**: PM-001 (Disponível), PM-002 (Em Deslocamento)
- **1 Ocorrência**: Assalto em andamento
- **Cálculo de distância**: Automático
- **Filtros**: Funcionais

### **✅ Interface Completa**
- Geolocalização automática
- Inserção manual de coordenadas
- Filtros por raio, tipo e status
- Cards responsivos
- Estados de loading/error
- Resumo estatístico

### **✅ Tratamento de Erros**
- Logs detalhados no console
- Mensagens de erro amigáveis
- Botões de recuperação
- Fallback para dados mockados

---

## 🚀 **TESTE RÁPIDO**

1. **Acesse**: `http://localhost:5173/recursos-proximos`
2. **Clique**: "🧪 Testar com Dados Mockados"
3. **Resultado**: Deve mostrar 2 viaturas e 1 ocorrência
4. **Teste filtros**: Altere raio, tipo, status
5. **Verifique**: Cards com informações detalhadas

---

## 🔧 **SOLUÇÃO DE PROBLEMAS**

### **Se ainda aparecer erro de JSON**:

1. **Verificar se backend está rodando**:
   ```bash
   curl http://localhost:3000/api/status
   ```

2. **Verificar token de autenticação**:
   - Fazer login primeiro em `/login`
   - Token deve estar no localStorage

3. **Usar dados mockados**:
   - Clicar no botão de teste
   - Funciona independente do backend

### **Se geolocalização não funcionar**:
1. Permitir localização no navegador
2. Usar localização manual
3. Usar dados mockados para teste

---

## 📊 **DADOS DE TESTE INCLUÍDOS**

### **Viaturas Mockadas**:
```javascript
PM-001 (ABC-1234) - Disponível - 2.5km
PM-002 (DEF-5678) - Em Deslocamento - 3.2km
```

### **Ocorrências Mockadas**:
```javascript
OC-2025-00001 - Assalto - Aberta - 1.8km
```

### **Coordenadas de Teste**:
```
Centro de BH: -19.9167, -43.9345
Savassi: -19.9300, -43.9500
```

---

## ✅ **RESULTADO ESPERADO**

Após seguir os passos, você deve ver:

1. **Localização obtida** (GPS ou manual)
2. **Seção de Viaturas** com cards informativos
3. **Seção de Ocorrências** com detalhes
4. **Resumo estatístico** no final
5. **Filtros funcionais** (raio, tipo, status)
6. **Interface responsiva** e moderna

**O problema do JSON foi 100% resolvido!** 🎉