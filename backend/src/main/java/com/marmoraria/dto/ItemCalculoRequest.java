package com.marmoraria.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Payload de entrada para o motor de cálculo de um item de orçamento.
 * Usado tanto pelo endpoint de "cálculo em tempo real" (preview, sem persistir)
 * quanto internamente ao salvar um orçamento completo.
 */
public class ItemCalculoRequest {

    @NotNull
    public UUID materialId;

    public UUID acabamentoId;

    public String descricaoPeca;

    @NotNull @DecimalMin("0.01")
    public BigDecimal comprimentoM;

    @NotNull @DecimalMin("0.01")
    public BigDecimal profundidadeM;

    public BigDecimal alturaFrontaoM = BigDecimal.ZERO;
    public BigDecimal alturaSaiaM = BigDecimal.ZERO;

    /** Se nulo, usa a espessura padrão do material. */
    public BigDecimal espessuraM;

    /** Percentual de perda (10 a 15). Se nulo, usa o padrão do material. */
    public BigDecimal percentualPerda;

    /** Projeção em balanço (cm) em relação ao ponto de apoio/armário. */
    public BigDecimal projecaoBalancoCm = BigDecimal.ZERO;

    public Boolean possuiRecorteCuba = false;
    public Boolean possuiRecorteCooktop = false;

    /** Menor borda de pedra ao redor do recorte (cm). Obrigatório se possuiRecorteCuba/Cooktop = true. */
    public BigDecimal bordaMinimaRecorteCm;

    public BigDecimal custoRecorteCuba = BigDecimal.ZERO;
    public BigDecimal custoRecorteCooktop = BigDecimal.ZERO;

    /** Metragem linear de borda a receber acabamento. */
    public BigDecimal metragemLinearAcabamento = BigDecimal.ZERO;
}
