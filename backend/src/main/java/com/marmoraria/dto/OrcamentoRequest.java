package com.marmoraria.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class OrcamentoRequest {

    @NotNull
    public UUID clienteId;

    @NotEmpty
    public List<ItemCalculoRequest> itens;

    public BigDecimal taxaFreteInstalacao = BigDecimal.ZERO;

    public String observacoes;
}
