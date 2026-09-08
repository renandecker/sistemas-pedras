package com.marmoraria.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ordens_servico_historico")
public class OrdemServicoHistorico extends PanacheEntityBase {

    @Id
    @GeneratedValue
    public UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ordem_servico_id")
    public OrdemServico ordemServico;

    @Enumerated(EnumType.STRING)
    @Column(name = "fase_anterior")
    public OrdemServico.Fase faseAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "fase_nova")
    public OrdemServico.Fase faseNova;

    @Column(name = "alterado_por")
    public String alteradoPor;

    @Column(name = "alterado_em")
    public LocalDateTime alteradoEm;

    @PrePersist
    void prePersist() {
        alteradoEm = LocalDateTime.now();
    }
}
