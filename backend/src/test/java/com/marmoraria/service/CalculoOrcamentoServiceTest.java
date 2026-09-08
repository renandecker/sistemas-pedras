package com.marmoraria.service;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class CalculoOrcamentoServiceTest {

    private final CalculoOrcamentoService service = new CalculoOrcamentoService();

    @Test
    void calcularAreaUtil_apenasBase() {
        BigDecimal area = service.calcularAreaUtil(
                new BigDecimal("2.00"), new BigDecimal("0.60"), BigDecimal.ZERO, BigDecimal.ZERO);
        assertEquals(new BigDecimal("1.200"), area);
    }

    @Test
    void calcularAreaUtil_comFrontaoESaia() {
        // Comprimento 2m, profundidade 0.6m, frontão 0.1m, saia 0.05m
        BigDecimal area = service.calcularAreaUtil(
                new BigDecimal("2.00"), new BigDecimal("0.60"),
                new BigDecimal("0.10"), new BigDecimal("0.05"));
        // (2*0.6) + (2*0.1) + (2*0.05) = 1.2 + 0.2 + 0.1 = 1.5
        assertEquals(new BigDecimal("1.500"), area);
    }

    @Test
    void calcularAreaBruta_comPerda10Porcento() {
        BigDecimal bruta = service.calcularAreaBruta(new BigDecimal("1.200"), new BigDecimal("10"));
        assertEquals(new BigDecimal("1.320"), bruta);
    }

    @Test
    void calcularPeso_granito() {
        // area 1.2 m2, espessura 0.02m, densidade 2700 kg/m3 -> 64.80 kg
        BigDecimal peso = service.calcularPeso(new BigDecimal("1.200"), new BigDecimal("0.020"), new BigDecimal("2700"));
        assertEquals(new BigDecimal("64.80"), peso);
    }

    @Test
    void alertaSustentacao_semSuporte() {
        assertEquals("NENHUM", service.avaliarAlertaSustentacao(new BigDecimal("10")));
        assertEquals("NENHUM", service.avaliarAlertaSustentacao(new BigDecimal("15")));
    }

    @Test
    void alertaSustentacao_cantoneira() {
        assertEquals("CANTONEIRA_METALICA", service.avaliarAlertaSustentacao(new BigDecimal("15.01")));
        assertEquals("CANTONEIRA_METALICA", service.avaliarAlertaSustentacao(new BigDecimal("30")));
    }

    @Test
    void alertaSustentacao_estruturaTubular() {
        assertEquals("ESTRUTURA_TUBULAR", service.avaliarAlertaSustentacao(new BigDecimal("30.01")));
        assertEquals("ESTRUTURA_TUBULAR", service.avaliarAlertaSustentacao(new BigDecimal("50")));
    }

    @Test
    void alertaBordaInsuficiente_bordaMenorQue5cm() {
        assertTrue(service.avaliarAlertaBordaInsuficiente(true, new BigDecimal("4.9")));
        assertFalse(service.avaliarAlertaBordaInsuficiente(true, new BigDecimal("5.0")));
        assertFalse(service.avaliarAlertaBordaInsuficiente(false, new BigDecimal("2.0")));
    }

    @Test
    void calcularCustoMaterial() {
        BigDecimal custo = service.calcularCustoMaterial(new BigDecimal("1.320"), new BigDecimal("480.00"));
        assertEquals(new BigDecimal("633.60"), custo);
    }
}
