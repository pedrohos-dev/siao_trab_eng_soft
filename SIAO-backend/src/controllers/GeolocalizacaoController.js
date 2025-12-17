const { validationResult } = require('express-validator');
const db = require('../database/jsonDatabase');
const GeolocalizacaoService = require('../services/GeolocalizacaoService');

class GeolocalizacaoController {
  async atualizarPosicao(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { viaturaId, latitude, longitude, velocidade } = req.body;

      // Verificar se viatura existe
      const viatura = db.findById('viaturas', viaturaId);
      if (!viatura) {
        return res.status(404).json({ error: 'Viatura não encontrada' });
      }

      const geolocalizacao = await GeolocalizacaoService.atualizarPosicaoViatura(
        viaturaId,
        latitude,
        longitude,
        velocidade
      );

      // WebSocket: notificar atualização de posição
      req.io.emit('posicao-viatura', {
        viaturaId,
        latitude,
        longitude,
        velocidade,
        timestamp: new Date().toISOString()
      });

      res.json(geolocalizacao);
    } catch (error) {
      console.error('Erro ao atualizar posição:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async getPosicaoViatura(req, res) {
    try {
      const { viaturaId } = req.params;
      
      // Verificar se viatura existe
      const viatura = db.findById('viaturas', viaturaId);
      if (!viatura) {
        return res.status(404).json({ error: 'Viatura não encontrada' });
      }
      
      const geolocalizacao = await GeolocalizacaoService.obterPosicaoViatura(viaturaId);
      
      if (!geolocalizacao) {
        return res.status(404).json({ error: 'Geolocalização não encontrada para esta viatura' });
      }
      
      res.json(geolocalizacao);
    } catch (error) {
      console.error('Erro ao buscar posição da viatura:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async getHistoricoPosicoes(req, res) {
    try {
      const { viaturaId } = req.params;
      const { dataInicio, dataFim } = req.query;
      
      // Verificar se viatura existe
      const viatura = db.findById('viaturas', viaturaId);
      if (!viatura) {
        return res.status(404).json({ error: 'Viatura não encontrada' });
      }
      
      // Buscar todas as posições da viatura
      let geolocalizacoes = db.findAll('geolocalizacao').filter(g => g.viaturaId === viaturaId);
      
      // Filtrar por data
      if (dataInicio && dataFim) {
        geolocalizacoes = geolocalizacoes.filter(g => {
          const data = new Date(g.dataHoraAtualizacao);
          return data >= new Date(dataInicio) && data <= new Date(dataFim);
        });
      }
      
      // Ordenar por data (mais antiga primeiro)
      geolocalizacoes.sort((a, b) => new Date(a.dataHoraAtualizacao) - new Date(b.dataHoraAtualizacao));
      
      res.json(geolocalizacoes);
    } catch (error) {
      console.error('Erro ao buscar histórico de posições:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async getViaturasProximas(req, res) {
    try {
      const { latitude, longitude, raio } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          error: 'Latitude e longitude são obrigatórios',
          success: false 
        });
      }
      
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const raioKm = raio ? parseFloat(raio) : 10;
      
      // Validar coordenadas
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ 
          error: 'Coordenadas inválidas',
          success: false 
        });
      }
      
      const viaturasProximas = await this.buscarViaturasComPosicao(lat, lng, raioKm);
      
      res.json({
        success: true,
        data: viaturasProximas,
        total: viaturasProximas.length,
        parametros: {
          latitude: lat,
          longitude: lng,
          raio: raioKm
        }
      });
    } catch (error) {
      console.error('Erro ao buscar viaturas próximas:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor', 
        message: error.message,
        success: false 
      });
    }
  }

  // Método auxiliar para buscar viaturas com posição
  async buscarViaturasComPosicao(latitude, longitude, raioKm) {
    try {
      // Buscar todas as viaturas
      const viaturas = db.findAll('viaturas');
      const geolocalizacoes = db.findAll('geolocalizacao');
      
      // Combinar viaturas com suas posições mais recentes
      const viaturasComPosicao = viaturas.map(viatura => {
        // Buscar posição mais recente da viatura
        const posicoesViatura = geolocalizacoes
          .filter(geo => geo.viaturaId === viatura.id)
          .sort((a, b) => new Date(b.dataHoraAtualizacao) - new Date(a.dataHoraAtualizacao));
        
        const posicaoAtual = posicoesViatura[0];
        
        if (posicaoAtual) {
          // Calcular distância
          const distancia = this.calcularDistancia(
            latitude, 
            longitude, 
            posicaoAtual.latitude, 
            posicaoAtual.longitude
          );
          
          return {
            ...viatura,
            posicao: posicaoAtual,
            distancia: distancia
          };
        }
        
        return null;
      }).filter(v => v !== null);
      
      // Filtrar por raio e ordenar por distância
      const viaturasProximas = viaturasComPosicao
        .filter(v => v.distancia <= raioKm)
        .sort((a, b) => a.distancia - b.distancia);
      
      return viaturasProximas;
    } catch (error) {
      console.error('Erro ao buscar viaturas com posição:', error);
      throw error;
    }
  }

  // Método para calcular distância entre dois pontos
  calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Novo endpoint para buscar todas as posições atuais
  async getTodasPosicoesAtuais(req, res) {
    try {
      const viaturas = db.findAll('viaturas');
      const geolocalizacoes = db.findAll('geolocalizacao');
      
      const posicoesAtuais = viaturas.map(viatura => {
        // Buscar posição mais recente
        const posicoesViatura = geolocalizacoes
          .filter(geo => geo.viaturaId === viatura.id)
          .sort((a, b) => new Date(b.dataHoraAtualizacao) - new Date(a.dataHoraAtualizacao));
        
        const posicaoAtual = posicoesViatura[0];
        
        if (posicaoAtual) {
          return {
            viatura,
            posicao: posicaoAtual
          };
        }
        
        return null;
      }).filter(p => p !== null);
      
      res.json({
        success: true,
        data: posicoesAtuais,
        total: posicoesAtuais.length
      });
    } catch (error) {
      console.error('Erro ao buscar posições atuais:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor', 
        message: error.message,
        success: false 
      });
    }
  }

  // Endpoint para verificar status de movimento de uma viatura
  async getStatusMovimento(req, res) {
    try {
      const { viaturaId } = req.params;
      
      const viatura = db.findById('viaturas', viaturaId);
      if (!viatura) {
        return res.status(404).json({ error: 'Viatura não encontrada' });
      }
      
      // Buscar últimas posições (últimos 10 minutos)
      const agora = new Date();
      const dezMinutosAtras = new Date(agora.getTime() - 10 * 60 * 1000);
      
      const posicoesRecentes = db.findAll('geolocalizacao')
        .filter(geo => 
          geo.viaturaId === viaturaId && 
          new Date(geo.dataHoraAtualizacao) >= dezMinutosAtras
        )
        .sort((a, b) => new Date(b.dataHoraAtualizacao) - new Date(a.dataHoraAtualizacao));
      
      let status = 'PARADA';
      let velocidadeMedia = 0;
      let distanciaPercorrida = 0;
      
      if (posicoesRecentes.length >= 2) {
        // Calcular velocidade média e distância
        let totalVelocidade = 0;
        let totalDistancia = 0;
        
        for (let i = 0; i < posicoesRecentes.length - 1; i++) {
          const pos1 = posicoesRecentes[i];
          const pos2 = posicoesRecentes[i + 1];
          
          const distancia = this.calcularDistancia(
            pos1.latitude, pos1.longitude,
            pos2.latitude, pos2.longitude
          );
          
          totalDistancia += distancia;
          totalVelocidade += pos1.velocidade || 0;
        }
        
        velocidadeMedia = totalVelocidade / posicoesRecentes.length;
        distanciaPercorrida = totalDistancia;
        
        if (velocidadeMedia > 5) { // Mais de 5 km/h
          status = 'EM_MOVIMENTO';
        }
      }
      
      res.json({
        success: true,
        data: {
          viaturaId,
          status,
          velocidadeMedia: Math.round(velocidadeMedia * 100) / 100,
          distanciaPercorrida: Math.round(distanciaPercorrida * 1000) / 1000, // em km
          ultimaAtualizacao: posicoesRecentes[0]?.dataHoraAtualizacao,
          totalPosicoes: posicoesRecentes.length
        }
      });
    } catch (error) {
      console.error('Erro ao verificar status de movimento:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor', 
        message: error.message,
        success: false 
      });
    }
  }
}

module.exports = new GeolocalizacaoController();