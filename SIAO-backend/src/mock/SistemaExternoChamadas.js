/**
 * Mock do Sistema Externo de Chamadas
 * Simula um sistema externo que envia chamadas para o SIAO
 */

const axios = require('axios');

class SistemaExternoChamadas {
  constructor() {
    this.baseURL = process.env.SIAO_API_URL || 'http://localhost:3000';
    this.sistemaId = 'SISTEMA_EXTERNO_190';
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Inicia o simulador de chamadas
   */
  iniciar(intervaloSegundos = 30) {
    if (this.isRunning) {
      console.log('⚠️ Simulador já está rodando');
      return;
    }

    console.log(`🎭 Iniciando simulador de chamadas externas (intervalo: ${intervaloSegundos}s)`);
    this.isRunning = true;

    // Enviar uma chamada inicial
    setTimeout(() => this.enviarChamadaAleatoria(), 2000);

    // Configurar envio periódico
    this.intervalId = setInterval(() => {
      this.enviarChamadaAleatoria();
    }, intervaloSegundos * 1000);
  }

  /**
   * Para o simulador
   */
  parar() {
    if (!this.isRunning) {
      console.log('⚠️ Simulador não está rodando');
      return;
    }

    console.log('🛑 Parando simulador de chamadas externas');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Envia uma chamada aleatória para o SIAO
   */
  async enviarChamadaAleatoria() {
    try {
      const chamada = this.gerarChamadaAleatoria();
      
      console.log(`📞 Enviando chamada externa: ${chamada.external_protocol}`);
      
      const response = await this.enviarChamada(chamada);
      
      if (response.success) {
        console.log(`✅ Chamada processada: ${chamada.external_protocol} → ${response.data.protocoloInterno}`);
      } else {
        console.log(`❌ Erro ao processar chamada: ${response.error}`);
      }

    } catch (error) {
      console.error('❌ Erro ao enviar chamada:', error.message);
    }
  }

  /**
   * Envia uma chamada específica para o SIAO
   */
  async enviarChamada(chamada) {
    try {
      // Primeiro, fazer login como sistema
      const loginResponse = await axios.post(`${this.baseURL}/api/auth/login`, {
        email: 'sistema@chamadas.gov.br',
        senha: 'senha123'
      });

      const token = loginResponse.data.token;

      // Enviar chamada
      const response = await axios.post(
        `${this.baseURL}/api/integracao/chamadas/receber`,
        chamada,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;

    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.data.error || error.response.data.message}`);
      } else {
        throw new Error(`Erro de rede: ${error.message}`);
      }
    }
  }

  /**
   * Gera uma chamada aleatória
   */
  gerarChamadaAleatoria() {
    const tipos = [
      'ROBBERY',
      'THEFT', 
      'TRAFFIC_ACCIDENT',
      'DOMESTIC_VIOLENCE',
      'HOMICIDE',
      'DRUG_TRAFFICKING',
      'VANDALISM',
      'DISTURBANCE'
    ];

    const locais = [
      { nome: 'Rua das Flores, 123 - Centro', lat: -19.9180, lng: -43.9360 },
      { nome: 'Av. Brasil, 456 - Savassi', lat: -19.9300, lng: -43.9500 },
      { nome: 'Praça da Liberdade - Centro', lat: -19.9320, lng: -43.9380 },
      { nome: 'Rua Bahia, 789 - Funcionários', lat: -19.9250, lng: -43.9420 },
      { nome: 'Av. Amazonas, 1000 - Centro', lat: -19.9200, lng: -43.9400 },
      { nome: 'Rua da Paz, 500 - Santa Efigênia', lat: -19.9280, lng: -43.9450 },
      { nome: 'Av. Contorno, 2000 - Savassi', lat: -19.9350, lng: -43.9380 },
      { nome: 'Rua Tupis, 300 - Centro', lat: -19.9190, lng: -43.9370 }
    ];

    const nomes = [
      'Maria Silva', 'João Santos', 'Ana Costa', 'Carlos Oliveira',
      'Fernanda Lima', 'Roberto Pereira', 'Juliana Alves', 'Pedro Rodrigues'
    ];

    const telefones = [
      '(31) 98888-8888', '(31) 97777-7777', '(31) 96666-6666', '(31) 95555-5555',
      '(31) 94444-4444', '(31) 93333-3333', '(31) 92222-2222', '(31) 91111-1111'
    ];

    const descricoes = {
      'ROBBERY': [
        'Assalto à mão armada em andamento',
        'Roubo de veículo na via pública',
        'Assalto a estabelecimento comercial',
        'Roubo a pedestre com arma branca'
      ],
      'THEFT': [
        'Furto de veículo estacionado',
        'Furto em residência',
        'Furto de celular na rua',
        'Furto em estabelecimento comercial'
      ],
      'TRAFFIC_ACCIDENT': [
        'Colisão entre dois veículos',
        'Atropelamento de pedestre',
        'Acidente com vítima presa nas ferragens',
        'Colisão com poste de energia'
      ],
      'DOMESTIC_VIOLENCE': [
        'Agressão física entre cônjuges',
        'Ameaça contra mulher',
        'Violência doméstica com lesão corporal',
        'Descumprimento de medida protetiva'
      ],
      'HOMICIDE': [
        'Corpo encontrado na via pública',
        'Homicídio por arma de fogo',
        'Morte suspeita em residência',
        'Tentativa de homicídio'
      ],
      'DRUG_TRAFFICKING': [
        'Tráfico de drogas flagrante',
        'Ponto de venda de entorpecentes',
        'Apreensão de grande quantidade de drogas',
        'Laboratório de refino de drogas'
      ],
      'VANDALISM': [
        'Pichação em prédio público',
        'Dano ao patrimônio público',
        'Quebra de vidraças',
        'Destruição de equipamentos urbanos'
      ],
      'DISTURBANCE': [
        'Perturbação do sossego público',
        'Briga em via pública',
        'Som alto em estabelecimento',
        'Aglomeração irregular'
      ]
    };

    const prioridades = ['LOW', 'MEDIUM', 'HIGH'];

    // Selecionar dados aleatórios
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const local = locais[Math.floor(Math.random() * locais.length)];
    const nome = nomes[Math.floor(Math.random() * nomes.length)];
    const telefone = telefones[Math.floor(Math.random() * telefones.length)];
    const descricao = descricoes[tipo][Math.floor(Math.random() * descricoes[tipo].length)];
    const prioridade = prioridades[Math.floor(Math.random() * prioridades.length)];

    // Gerar protocolo único
    const timestamp = Date.now();
    const protocoloExterno = `EXT-${new Date().getFullYear()}-${String(timestamp).slice(-6)}`;

    // Adicionar variação nas coordenadas (±0.01 graus)
    const latVariacao = (Math.random() - 0.5) * 0.02;
    const lngVariacao = (Math.random() - 0.5) * 0.02;

    return {
      external_protocol: protocoloExterno,
      system_id: this.sistemaId,
      incident_type: tipo,
      description: descricao,
      location: local.nome,
      latitude: local.lat + latVariacao,
      longitude: local.lng + lngVariacao,
      caller_name: nome,
      caller_phone: telefone,
      caller_address: local.nome,
      priority: prioridade,
      timestamp: new Date().toISOString(),
      additional_info: `Chamada gerada automaticamente pelo simulador em ${new Date().toLocaleString('pt-BR')}`,
      notes: `Sistema: ${this.sistemaId} | Prioridade: ${prioridade}`
    };
  }

  /**
   * Envia lote de chamadas para teste
   */
  async enviarLoteTeste(quantidade = 5) {
    try {
      console.log(`📦 Enviando lote de ${quantidade} chamadas de teste`);

      const chamadas = [];
      for (let i = 0; i < quantidade; i++) {
        chamadas.push(this.gerarChamadaAleatoria());
      }

      // Login
      const loginResponse = await axios.post(`${this.baseURL}/api/auth/login`, {
        email: 'sistema@chamadas.gov.br',
        senha: 'senha123'
      });

      const token = loginResponse.data.token;

      // Enviar lote
      const response = await axios.post(
        `${this.baseURL}/api/integracao/chamadas/lote`,
        { chamadas },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Lote processado: ${response.data.data.sucessos} sucessos, ${response.data.data.erros} erros`);
      return response.data;

    } catch (error) {
      console.error('❌ Erro ao enviar lote:', error.message);
      throw error;
    }
  }

  /**
   * Obtém status da integração
   */
  async obterStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/api/integracao/chamadas/status`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter status:', error.message);
      throw error;
    }
  }
}

// Exportar instância singleton
const simulador = new SistemaExternoChamadas();

// Se executado diretamente, iniciar simulador
if (require.main === module) {
  console.log('🎭 Iniciando simulador de sistema externo de chamadas');
  
  // Aguardar um pouco para o servidor principal iniciar
  setTimeout(() => {
    simulador.iniciar(45); // Enviar chamada a cada 45 segundos
  }, 5000);

  // Tratar sinais de interrupção
  process.on('SIGINT', () => {
    console.log('\n🛑 Recebido sinal de interrupção');
    simulador.parar();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Recebido sinal de término');
    simulador.parar();
    process.exit(0);
  });
}

module.exports = simulador;