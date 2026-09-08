package com.marmoraria.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "lotes_chapa")
public class LoteChapa extends PanacheEntityBase {

    public enum Tipo { CHAPA_INTEIRA, RETALHO }

    @Id
    @GeneratedValue
    public UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "material_id")
    public Material material;

    @Column(name = "codigo_lote")
    @NotNull
    public String codigoLote;

    @Enumerated(EnumType.STRING)
    public Tipo tipo = Tipo.CHAPA_INTEIRA;

    @Column(name = "largura_m")
    public BigDecimal larguraM;

    @Column(name = "comprimento_m")
    public BigDecimal comprimentoM;

    @Column(name = "area_m2", insertable = false, updatable = false)
    public BigDecimal areaM2;

    public String localizacao;

    public Boolean reservado = false;

    @Column(name = "criado_em", updatable = false)
    public LocalDateTime criadoEm;

    @PrePersist
    void prePersist() {
        criadoEm = LocalDateTime.now();
    }
}
