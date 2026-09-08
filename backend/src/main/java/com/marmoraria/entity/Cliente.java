package com.marmoraria.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "clientes")
public class Cliente extends PanacheEntityBase {

    @Id
    @GeneratedValue
    public UUID id;

    @NotBlank
    public String nome;

    public String telefone;
    public String email;
    public String endereco;
    public String documento;

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
