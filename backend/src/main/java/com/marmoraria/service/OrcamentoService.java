package com.marmoraria.service;

import com.marmoraria.dto.ItemCalculoRequest;
import com.marmoraria.dto.ItemCalculoResponse;
import com.marmoraria.dto.OrcamentoRequest;
import com.marmoraria.entity.*;
import com.marmoraria.exception.RegraNegocioException;
import com.marmoraria.repository.AcabamentoRepository;
import com.marmoraria.repository.ClienteRepository;
import com.marmoraria.repository.MaterialRepository;
import com.marmoraria.repository.OrcamentoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class OrcamentoService {

    @Inject OrcamentoRepository orcamentoRepository;
    @Inject ClienteRepository clienteRepository;
    @Inject MaterialRepository materialRepository;
    @Inject AcabamentoRepository acabamentoRepository;
    @Inject CalculoOrcamentoService calculoService;

    /** Calcula um item isoladamente (usado pelo formulário em tempo real do front). */
    public ItemCalculoResponse calcularPreview(ItemCalculoRequest req) {
        Material material = materialRepository.findByIdOptional(req.materialId)
                .orElseThrow(() -> new RegraNegocioException("Material não encontrado."));
        Acabamento acabamento = req.acabamentoId != null
                ? acabamentoRepository.findByIdOptional(req.acabamentoId).orElse(null)
                : null;
        return calculoService.calcularItem(req, material, acabamento);
    }

    @Transactional
    public Orcamento criar(OrcamentoRequest req) {
        Cliente cliente = clienteRepository.findByIdOptional(req.clienteId)
                .orElseThrow(() -> new RegraNegocioException("Cliente não encontrado."));

        Orcamento orcamento = new Orcamento();
        orcamento.cliente = cliente;
        orcamento.taxaFreteInstalacao = req.taxaFreteInstalacao == null ? BigDecimal.ZERO : req.taxaFreteInstalacao;
        orcamento.observacoes = req.observacoes;
        orcamento.status = Orcamento.Status.RASCUNHO;

        aplicarItens(orcamento, req.itens);

        orcamentoRepository.persist(orcamento);
        return orcamento;
    }

    @Transactional
    public Orcamento atualizar(UUID id, OrcamentoRequest req) {
        Orcamento orcamento = orcamentoRepository.findByIdOptional(id)
                .orElseThrow(() -> new RegraNegocioException("Orçamento não encontrado."));

        if (orcamento.status != Orcamento.Status.RASCUNHO) {
            throw new RegraNegocioException("Somente orçamentos em RASCUNHO podem ser editados.");
        }

        Cliente cliente = clienteRepository.findByIdOptional(req.clienteId)
                .orElseThrow(() -> new RegraNegocioException("Cliente não encontrado."));
        orcamento.cliente = cliente;
        orcamento.taxaFreteInstalacao = req.taxaFreteInstalacao == null ? BigDecimal.ZERO : req.taxaFreteInstalacao;
        orcamento.observacoes = req.observacoes;

        orcamento.itens.clear();
        aplicarItens(orcamento, req.itens);

        return orcamento;
    }

    /** Recalcula todos os itens e agrega os totais do orçamento (3.3 do PRD). */
    private void aplicarItens(Orcamento orcamento, List<ItemCalculoRequest> itensReq) {
        BigDecimal areaUtilTotal = BigDecimal.ZERO;
        BigDecimal areaBrutaTotal = BigDecimal.ZERO;
        BigDecimal pesoTotal = BigDecimal.ZERO;
        BigDecimal custoMaterialTotal = BigDecimal.ZERO;
        BigDecimal custoAcabamentosTotal = BigDecimal.ZERO;
        BigDecimal custoServicosAdicionaisTotal = BigDecimal.ZERO;

        for (ItemCalculoRequest req : itensReq) {
            Material material = materialRepository.findByIdOptional(req.materialId)
                    .orElseThrow(() -> new RegraNegocioException("Material não encontrado: " + req.materialId));
            Acabamento acabamento = req.acabamentoId != null
                    ? acabamentoRepository.findByIdOptional(req.acabamentoId).orElse(null)
                    : null;

            ItemCalculoResponse calc = calculoService.calcularItem(req, material, acabamento);

            // Erro de borda mínima é BLOQUEANTE: não permite salvar o orçamento
            if (calc.alertaBordaInsuficiente) {
                throw new RegraNegocioException(
                        "Borda mínima de segurança insuficiente (mínimo 5cm) na peça: "
                                + (req.descricaoPeca != null ? req.descricaoPeca : "sem descrição"));
            }

            ItemOrcamento item = new ItemOrcamento();
            item.orcamento = orcamento;
            item.material = material;
            item.acabamento = acabamento;
            item.descricaoPeca = req.descricaoPeca;
            item.comprimentoM = req.comprimentoM;
            item.profundidadeM = req.profundidadeM;
            item.alturaFrontaoM = req.alturaFrontaoM;
            item.alturaSaiaM = req.alturaSaiaM;
            item.espessuraM = req.espessuraM != null ? req.espessuraM : material.espessuraPadraoM;
            item.percentualPerda = req.percentualPerda != null ? req.percentualPerda : material.percentualPerdaPadrao;
            item.projecaoBalancoCm = req.projecaoBalancoCm;
            item.alertaSustentacao = ItemOrcamento.AlertaSustentacao.valueOf(calc.alertaSustentacao);
            item.possuiRecorteCuba = req.possuiRecorteCuba;
            item.possuiRecorteCooktop = req.possuiRecorteCooktop;
            item.bordaMinimaRecorteCm = req.bordaMinimaRecorteCm;
            item.alertaBordaInsuficiente = calc.alertaBordaInsuficiente;
            item.custoRecorteCuba = req.custoRecorteCuba;
            item.custoRecorteCooktop = req.custoRecorteCooktop;
            item.metragemLinearAcabamento = req.metragemLinearAcabamento;
            item.areaUtilM2 = calc.areaUtilM2;
            item.areaBrutaM2 = calc.areaBrutaM2;
            item.pesoCalculadoKg = calc.pesoCalculadoKg;
            item.custoMaterialItem = calc.custoMaterialItem;
            item.custoAcabamentoItem = calc.custoAcabamentoItem;
            item.precoSubtotal = calc.precoSubtotal;

            orcamento.itens.add(item);

            areaUtilTotal = areaUtilTotal.add(calc.areaUtilM2);
            areaBrutaTotal = areaBrutaTotal.add(calc.areaBrutaM2);
            pesoTotal = pesoTotal.add(calc.pesoCalculadoKg);
            custoMaterialTotal = custoMaterialTotal.add(calc.custoMaterialItem);
            custoAcabamentosTotal = custoAcabamentosTotal.add(calc.custoAcabamentoItem);
            custoServicosAdicionaisTotal = custoServicosAdicionaisTotal.add(calc.custoRecortes);
        }

        custoServicosAdicionaisTotal = custoServicosAdicionaisTotal.add(orcamento.taxaFreteInstalacao);

        orcamento.areaUtilTotalM2 = areaUtilTotal;
        orcamento.areaBrutaTotalM2 = areaBrutaTotal;
        orcamento.pesoTotalKg = pesoTotal;
        orcamento.custoMaterial = custoMaterialTotal;
        orcamento.custoAcabamentos = custoAcabamentosTotal;
        orcamento.custoServicosAdicionais = custoServicosAdicionaisTotal;
        orcamento.valorTotal = custoMaterialTotal.add(custoAcabamentosTotal).add(custoServicosAdicionaisTotal);
    }

    @Transactional
    public void aprovar(UUID id) {
        Orcamento orcamento = orcamentoRepository.findByIdOptional(id)
                .orElseThrow(() -> new RegraNegocioException("Orçamento não encontrado."));
        if (orcamento.status != Orcamento.Status.RASCUNHO) {
            throw new RegraNegocioException("Somente orçamentos em RASCUNHO podem ser aprovados.");
        }
        orcamento.status = Orcamento.Status.APROVADO;
    }
}
