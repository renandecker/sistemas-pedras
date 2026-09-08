package com.marmoraria.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "materiais")
public class Material extends PanacheEntityBase {

    public enum Categoria { GRANITO, MARMORE, QUARTZO, QUARTZITO, ULTRACOMPACTO }

    @Id
    @GeneratedValue
    public UUID id;

    @NotBlank
    public String nome;

    @NotNull
    @Enumerated(EnumType.STRING)
    public Categoria categoria;

    @Column(name = "densidade_kg_m3")
    @NotNull
    public BigDecimal densidadeKgM3;

    @Column(name = "espessura_padrao_m")
    public BigDecimal espessuraPadraoM = new BigDecimal("0.020");

    @Column(name = "preco_m2")
    @NotNull
    public BigDecimal precoM2;

    @Column(name = "estoque_m2")
    public BigDecimal estoqueM2 = BigDecimal.ZERO;

    @Column(name = "percentual_perda_padrao")
    public BigDecimal percentualPerdaPadrao = new BigDecimal("10.00");

    public Boolean ativo = true;

    @Column(name = "criado_em", updatable = false)
    public LocalDateTime criadoEm;

    @Column(name = "atualizado_em")
    public LocalDateTime atualizadoEm;

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
