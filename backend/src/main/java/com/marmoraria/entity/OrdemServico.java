package com.marmoraria.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ordens_servico")
public class OrdemServico extends PanacheEntityBase {

    // Ordem representa a sequência do fluxo produtivo (Kanban)
    public enum Fase {
        RASCUNHO, MEDICAO_FINA, CORTE, LAPIDACAO_ACABAMENTO, MONTAGEM, INSTALACAO, CONCLUIDO
    }

    @Id
    @GeneratedValue
    public UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "orcamento_id")
    public Orcamento orcamento;

    public String codigo;

    @Enumerated(EnumType.STRING)
    @Column(name = "fase_atual")
    public Fase faseAtual = Fase.RASCUNHO;

    public String responsavel;

    @Column(name = "data_prevista_entrega")
    public LocalDate dataPrevistaEntrega;

    @Column(name = "data_conclusao")
    public LocalDateTime dataConclusao;

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

    /** Ordem válida das fases, usada para bloquear "pular etapas" no Kanban. */
    public static final Fase[] SEQUENCIA = {
        Fase.RASCUNHO, Fase.MEDICAO_FINA, Fase.CORTE,
        Fase.LAPIDACAO_ACABAMENTO, Fase.MONTAGEM, Fase.INSTALACAO, Fase.CONCLUIDO
    };
}
