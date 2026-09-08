package com.marmoraria.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "itens_orcamento")
public class ItemOrcamento extends PanacheEntityBase {

    public enum AlertaSustentacao { NENHUM, CANTONEIRA_METALICA, ESTRUTURA_TUBULAR }

    @Id
    @GeneratedValue
    public UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "orcamento_id")
    public Orcamento orcamento;

    @ManyToOne(optional = false)
    @JoinColumn(name = "material_id")
    public Material material;

    @ManyToOne
    @JoinColumn(name = "acabamento_id")
    public Acabamento acabamento;

    @Column(name = "descricao_peca")
    public String descricaoPeca;

    // dimensões de entrada
    @Column(name = "comprimento_m")
    public BigDecimal comprimentoM;

    @Column(name = "profundidade_m")
    public BigDecimal profundidadeM;

    @Column(name = "altura_frontao_m")
    public BigDecimal alturaFrontaoM = BigDecimal.ZERO;

    @Column(name = "altura_saia_m")
    public BigDecimal alturaSaiaM = BigDecimal.ZERO;

    @Column(name = "espessura_m")
    public BigDecimal espessuraM;

    @Column(name = "percentual_perda")
    public BigDecimal percentualPerda = new BigDecimal("10.00");

    // sustentação / balanço
    @Column(name = "projecao_balanco_cm")
    public BigDecimal projecaoBalancoCm = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "alerta_sustentacao")
    public AlertaSustentacao alertaSustentacao = AlertaSustentacao.NENHUM;

    // recortes cuba/cooktop
    @Column(name = "possui_recorte_cuba")
    public Boolean possuiRecorteCuba = false;

    @Column(name = "possui_recorte_cooktop")
    public Boolean possuiRecorteCooktop = false;

    @Column(name = "borda_minima_recorte_cm")
    public BigDecimal bordaMinimaRecorteCm;

    @Column(name = "alerta_borda_insuficiente")
    public Boolean alertaBordaInsuficiente = false;

    @Column(name = "custo_recorte_cuba")
    public BigDecimal custoRecorteCuba = BigDecimal.ZERO;

    @Column(name = "custo_recorte_cooktop")
    public BigDecimal custoRecorteCooktop = BigDecimal.ZERO;

    // acabamento
    @Column(name = "metragem_linear_acabamento")
    public BigDecimal metragemLinearAcabamento = BigDecimal.ZERO;

    // valores calculados
    @Column(name = "area_util_m2")
    public BigDecimal areaUtilM2 = BigDecimal.ZERO;

    @Column(name = "area_bruta_m2")
    public BigDecimal areaBrutaM2 = BigDecimal.ZERO;

    @Column(name = "peso_calculado_kg")
    public BigDecimal pesoCalculadoKg = BigDecimal.ZERO;

    @Column(name = "custo_material_item")
    public BigDecimal custoMaterialItem = BigDecimal.ZERO;

    @Column(name = "custo_acabamento_item")
    public BigDecimal custoAcabamentoItem = BigDecimal.ZERO;

    @Column(name = "preco_subtotal")
    public BigDecimal precoSubtotal = BigDecimal.ZERO;

    @Column(name = "criado_em", updatable = false)
    public LocalDateTime criadoEm;

    @PrePersist
    void prePersist() {
        criadoEm = LocalDateTime.now();
    }
}
