package com.marmoraria.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Resultado do motor de cálculo para um item, incluindo os alertas técnicos
 * de segurança que a UI deve exibir (aviso amarelo ou erro bloqueante).
 */
public class ItemCalculoResponse {

    public BigDecimal areaUtilM2;
    public BigDecimal areaBrutaM2;
    public BigDecimal pesoCalculadoKg;

    public BigDecimal custoMaterialItem;
    public BigDecimal custoAcabamentoItem;
    public BigDecimal custoRecortes;
    public BigDecimal precoSubtotal;

    public String alertaSustentacao;       // NENHUM | CANTONEIRA_METALICA | ESTRUTURA_TUBULAR
    public boolean alertaBordaInsuficiente; // true = erro bloqueante

    /** Lista de mensagens legíveis para exibição direta na UI. */
    public List<AlertaTecnico> alertas = new ArrayList<>();

    public static class AlertaTecnico {
        public String nivel;    // "AVISO" ou "ERRO"
        public String mensagem;

        public AlertaTecnico(String nivel, String mensagem) {
            this.nivel = nivel;
            this.mensagem = mensagem;
        }
    }
}
