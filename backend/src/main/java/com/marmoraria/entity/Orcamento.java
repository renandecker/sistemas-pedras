package com.marmoraria.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orcamentos")
public class Orcamento extends PanacheEntityBase {

    public enum Status { RASCUNHO, APROVADO, EM_PRODUCAO, CONCLUIDO, CANCELADO }

    @Id
    @GeneratedValue
    public UUID id;

    @Column(insertable = false, updatable = false)
    public Integer numero;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    @Enumerated(EnumType.STRING)
    public Status status = Status.RASCUNHO;

    @Column(name = "area_util_total_m2")
    public BigDecimal areaUtilTotalM2 = BigDecimal.ZERO;

    @Column(name = "area_bruta_total_m2")
    public BigDecimal areaBrutaTotalM2 = BigDecimal.ZERO;

    @Column(name = "peso_total_kg")
    public BigDecimal pesoTotalKg = BigDecimal.ZERO;

    @Column(name = "custo_material")
    public BigDecimal custoMaterial = BigDecimal.ZERO;

    @Column(name = "custo_acabamentos")
    public BigDecimal custoAcabamentos = BigDecimal.ZERO;

    @Column(name = "custo_servicos_adicionais")
    public BigDecimal custoServicosAdicionais = BigDecimal.ZERO;

    @Column(name = "valor_total")
    public BigDecimal valorTotal = BigDecimal.ZERO;

    @Column(name = "taxa_frete_instalacao")
    public BigDecimal taxaFreteInstalacao = BigDecimal.ZERO;

    public String observacoes;

    @Column(name = "criado_em", updatable = false)
    public LocalDateTime criadoEm;

    @Column(name = "atualizado_em")
    public LocalDateTime atualizadoEm;

    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<ItemOrcamento> itens = new ArrayList<>();

    @PrePersist
    void prePersist() {
        criadoEm = LocalDateTime.now();
        atualizadoEm = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        atualizadoEm = LocalDateTime.now();
    }
}
