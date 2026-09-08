package com.marmoraria.service;

import com.marmoraria.dto.ItemCalculoRequest;
import com.marmoraria.dto.ItemCalculoResponse;
import com.marmoraria.entity.Acabamento;
import com.marmoraria.entity.Material;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

/**
 * Motor de cálculo do sistema de marmoraria.
 *
 * Todas as funções aqui são PURAS (sem efeitos colaterais, sem acesso a banco),
 * o que facilita testes unitários isolados (ver CalculoOrcamentoServiceTest).
 *
 * Fórmulas conforme especificação do PRD, seção 3.
 */
@ApplicationScoped
public class CalculoOrcamentoService {

    private static final MathContext MC = new MathContext(10, RoundingMode.HALF_UP);
    private static final int SCALE_AREA = 3;
    private static final int SCALE_MONEY = 2;

    // Limites de balanço/projeção (cm) — regras de sustentação (seção 2.1 do PRD)
    public static final BigDecimal LIMITE_SEM_SUPORTE_CM = new BigDecimal("15");
    public static final BigDecimal LIMITE_CANTONEIRA_CM = new BigDecimal("30");

    // Borda mínima de segurança para recortes de cuba/cooktop (seção 2.1)
    public static final BigDecimal BORDA_MINIMA_SEGURANCA_CM = new BigDecimal("5");

    // Faixa válida de margem de perda (seção 2.1)
    public static final BigDecimal PERDA_MINIMA = new BigDecimal("10");
    public static final BigDecimal PERDA_MAXIMA = new BigDecimal("15");

    /**
     * 3.1 - Área Útil (m²)
     * AreaUtil = (Comprimento * Profundidade) + (Comprimento * AlturaFrontao) + (Comprimento * AlturaSaia)
     */
    public BigDecimal calcularAreaUtil(BigDecimal comprimento, BigDecimal profundidade,
                                        BigDecimal alturaFrontao, BigDecimal alturaSaia) {
        BigDecimal frontao = alturaFrontao == null ? BigDecimal.ZERO : alturaFrontao;
        BigDecimal saia = alturaSaia == null ? BigDecimal.ZERO : alturaSaia;

        BigDecimal areaBase = comprimento.multiply(profundidade, MC);
        BigDecimal areaFrontao = comprimento.multiply(frontao, MC);
        BigDecimal areaSaia = comprimento.multiply(saia, MC);

        return areaBase.add(areaFrontao).add(areaSaia).setScale(SCALE_AREA, RoundingMode.HALF_UP);
    }

    /**
     * 3.1 - Área Bruta (m²)
     * AreaBruta = AreaUtil * (1 + PercentualPerda / 100)
     */
    public BigDecimal calcularAreaBruta(BigDecimal areaUtil, BigDecimal percentualPerda) {
        BigDecimal fator = BigDecimal.ONE.add(percentualPerda.divide(new BigDecimal("100"), MC));
        return areaUtil.multiply(fator, MC).setScale(SCALE_AREA, RoundingMode.HALF_UP);
    }

    /**
     * 3.2 - Peso Total (kg)
     * PesoTotal = AreaUtil * EspessuraEmMetros * DensidadeMaterial
     */
    public BigDecimal calcularPeso(BigDecimal areaUtil, BigDecimal espessuraM, BigDecimal densidadeKgM3) {
        return areaUtil.multiply(espessuraM, MC).multiply(densidadeKgM3, MC)
                .setScale(SCALE_MONEY, RoundingMode.HALF_UP);
    }

    /**
     * 2.1 - Regra de sustentação/balanço, a partir da projeção em cm.
     *   <= 15cm            -> NENHUM
     *   15cm < x <= 30cm   -> CANTONEIRA_METALICA
     *   > 30cm             -> ESTRUTURA_TUBULAR
     */
    public String avaliarAlertaSustentacao(BigDecimal projecaoBalancoCm) {
        if (projecaoBalancoCm == null || projecaoBalancoCm.compareTo(LIMITE_SEM_SUPORTE_CM) <= 0) {
            return "NENHUM";
        } else if (projecaoBalancoCm.compareTo(LIMITE_CANTONEIRA_CM) <= 0) {
            return "CANTONEIRA_METALICA";
        } else {
            return "ESTRUTURA_TUBULAR";
        }
    }

    /**
     * 2.1 - Regra de borda mínima para recortes de cuba/cooktop: mínimo 5cm.
     * Retorna true (erro bloqueante) se a borda informada for menor que o mínimo.
     */
    public boolean avaliarAlertaBordaInsuficiente(boolean possuiRecorte, BigDecimal bordaMinimaCm) {
        if (!possuiRecorte) return false;
        if (bordaMinimaCm == null) return true; // sem informação = trata como não conforme
        return bordaMinimaCm.compareTo(BORDA_MINIMA_SEGURANCA_CM) < 0;
    }

    /**
     * 3.3 - Custo do material do item.
     * CustoMaterial = AreaBruta * PrecoMetroQuadradoPedra
     */
    public BigDecimal calcularCustoMaterial(BigDecimal areaBruta, BigDecimal precoM2) {
        return areaBruta.multiply(precoM2, MC).setScale(SCALE_MONEY, RoundingMode.HALF_UP);
    }

    /**
     * 3.3 - Custo do acabamento de borda para o item, aplicando o multiplicador
     * de complexidade sobre o preço-base por metro linear.
     * CustoAcabamentos = SUM(ComprimentoBorda * PrecoMetroLinearAcabamento)
     */
    public BigDecimal calcularCustoAcabamento(BigDecimal metragemLinear, Acabamento acabamento) {
        if (acabamento == null || metragemLinear == null || metragemLinear.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal precoEfetivo = acabamento.precoBaseMetroLinear.multiply(acabamento.multiplicadorComplexidade, MC);
        return metragemLinear.multiply(precoEfetivo, MC).setScale(SCALE_MONEY, RoundingMode.HALF_UP);
    }

    /**
     * Executa o cálculo completo de um item de orçamento, aplicando todas as
     * regras de negócio e gerando os alertas técnicos correspondentes.
     */
    public ItemCalculoResponse calcularItem(ItemCalculoRequest req, Material material, Acabamento acabamento) {
        ItemCalculoResponse resp = new ItemCalculoResponse();

        BigDecimal espessura = req.espessuraM != null ? req.espessuraM : material.espessuraPadraoM;
        BigDecimal percentualPerda = req.percentualPerda != null ? req.percentualPerda : material.percentualPerdaPadrao;

        // Clamp de segurança: percentual de perda deve ficar entre 10% e 15% (seção 2.1)
        if (percentualPerda.compareTo(PERDA_MINIMA) < 0) percentualPerda = PERDA_MINIMA;
        if (percentualPerda.compareTo(PERDA_MAXIMA) > 0) percentualPerda = PERDA_MAXIMA;

        BigDecimal areaUtil = calcularAreaUtil(req.comprimentoM, req.profundidadeM, req.alturaFrontaoM, req.alturaSaiaM);
        BigDecimal areaBruta = calcularAreaBruta(areaUtil, percentualPerda);
        BigDecimal peso = calcularPeso(areaUtil, espessura, material.densidadeKgM3);

        BigDecimal custoMaterial = calcularCustoMaterial(areaBruta, material.precoM2);
        BigDecimal custoAcabamento = calcularCustoAcabamento(req.metragemLinearAcabamento, acabamento);

        BigDecimal custoRecortes = (req.custoRecorteCuba == null ? BigDecimal.ZERO : req.custoRecorteCuba)
                .add(req.custoRecorteCooktop == null ? BigDecimal.ZERO : req.custoRecorteCooktop);

        BigDecimal subtotal = custoMaterial.add(custoAcabamento).add(custoRecortes)
                .setScale(SCALE_MONEY, RoundingMode.HALF_UP);

        String alertaSustentacao = avaliarAlertaSustentacao(req.projecaoBalancoCm);
        boolean recorteAlvo = Boolean.TRUE.equals(req.possuiRecorteCuba) || Boolean.TRUE.equals(req.possuiRecorteCooktop);
        boolean alertaBorda = avaliarAlertaBordaInsuficiente(recorteAlvo, req.bordaMinimaRecorteCm);

        resp.areaUtilM2 = areaUtil;
        resp.areaBrutaM2 = areaBruta;
        resp.pesoCalculadoKg = peso;
        resp.custoMaterialItem = custoMaterial;
        resp.custoAcabamentoItem = custoAcabamento;
        resp.custoRecortes = custoRecortes;
        resp.precoSubtotal = subtotal;
        resp.alertaSustentacao = alertaSustentacao;
        resp.alertaBordaInsuficiente = alertaBorda;

        if ("CANTONEIRA_METALICA".equals(alertaSustentacao)) {
            resp.alertas.add(new ItemCalculoResponse.AlertaTecnico("AVISO", "Requer Cantoneiras Metálicas"));
        } else if ("ESTRUTURA_TUBULAR".equals(alertaSustentacao)) {
            resp.alertas.add(new ItemCalculoResponse.AlertaTecnico("AVISO", "Requer Estrutura Tubular de Sustentação"));
        }
        if (alertaBorda) {
            resp.alertas.add(new ItemCalculoResponse.AlertaTecnico("ERRO",
                    "Borda mínima de segurança insuficiente (mínimo 5cm)"));
        }

        return resp;
    }
}
