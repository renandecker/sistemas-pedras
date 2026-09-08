package com.marmoraria.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "acabamentos")
public class Acabamento extends PanacheEntityBase {

    public enum Tipo { RETO_POLIDO, BISOTE, BOLEADO, MEIA_ESQUADRIA, PEITO_DE_POMBO }

    @Id
    @GeneratedValue
    public UUID id;

    @NotNull
    public String nome;

    @Enumerated(EnumType.STRING)
    public Tipo tipo;

    @Column(name = "unidade_medida")
    public String unidadeMedida = "M_LINEAR";

    @Column(name = "multiplicador_complexidade")
    @NotNull
    public BigDecimal multiplicadorComplexidade;

    @Column(name = "preco_base_metro_linear")
    @NotNull
    public BigDecimal precoBaseMetroLinear;

    @Column(name = "descricao_tecnica")
    public String descricaoTecnica;

    public Boolean ativo = true;
}
