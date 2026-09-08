package com.marmoraria.service;

import com.marmoraria.entity.Orcamento;
import com.marmoraria.entity.OrdemServico;
import com.marmoraria.entity.OrdemServicoHistorico;
import com.marmoraria.exception.RegraNegocioException;
import com.marmoraria.repository.OrcamentoRepository;
import com.marmoraria.repository.OrdemServicoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.UUID;

@ApplicationScoped
public class OrdemServicoService {

    @Inject OrdemServicoRepository ordemServicoRepository;
    @Inject OrcamentoRepository orcamentoRepository;

    @Transactional
    public OrdemServico criarAPartirDeOrcamento(UUID orcamentoId, String responsavel) {
        Orcamento orcamento = orcamentoRepository.findByIdOptional(orcamentoId)
                .orElseThrow(() -> new RegraNegocioException("Orçamento não encontrado."));

        if (orcamento.status != Orcamento.Status.APROVADO) {
            throw new RegraNegocioException("Somente orçamentos APROVADOS podem gerar Ordem de Serviço.");
        }

        long count = OrdemServico.count();
        String codigo = "OS-" + LocalDateTime.now().getYear() + "-" + String.format("%04d", count + 1);

        OrdemServico os = new OrdemServico();
        os.orcamento = orcamento;
        os.codigo = codigo;
        os.responsavel = responsavel;
        os.faseAtual = OrdemServico.Fase.RASCUNHO;

        ordemServicoRepository.persist(os);
        orcamento.status = Orcamento.Status.EM_PRODUCAO;

        return os;
    }

    /**
     * Move a Ordem de Serviço para a próxima fase, ou para uma fase específica,
     * respeitando a sequência definida em OrdemServico.SEQUENCIA (não permite pular etapas
     * "para frente" sem passar pelas intermediárias).
     */
    @Transactional
    public OrdemServico avancarFase(UUID osId, OrdemServico.Fase novaFase, String alteradoPor) {
        OrdemServico os = ordemServicoRepository.findByIdOptional(osId)
                .orElseThrow(() -> new RegraNegocioException("Ordem de Serviço não encontrada."));

        int idxAtual = indiceFase(os.faseAtual);
        int idxNova = indiceFase(novaFase);

        // Permite avançar uma etapa por vez, ou retroceder livremente (correção de fluxo)
        if (idxNova > idxAtual + 1) {
            throw new RegraNegocioException(
                    "Não é possível pular etapas: a fase atual é " + os.faseAtual +
                            ", a próxima fase permitida é " + OrdemServico.SEQUENCIA[idxAtual + 1]);
        }

        OrdemServico.Fase faseAnterior = os.faseAtual;
        os.faseAtual = novaFase;

        if (novaFase == OrdemServico.Fase.CONCLUIDO) {
            os.dataConclusao = LocalDateTime.now();
            os.orcamento.status = Orcamento.Status.CONCLUIDO;
        }

        OrdemServicoHistorico historico = new OrdemServicoHistorico();
        historico.ordemServico = os;
        historico.faseAnterior = faseAnterior;
        historico.faseNova = novaFase;
        historico.alteradoPor = alteradoPor;
        historico.persist();

        return os;
    }

    private int indiceFase(OrdemServico.Fase fase) {
        return Arrays.asList(OrdemServico.SEQUENCIA).indexOf(fase);
    }
}
