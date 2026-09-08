package com.marmoraria.repository;

import com.marmoraria.entity.Orcamento;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class OrcamentoRepository implements PanacheRepositoryBase<Orcamento, UUID> {
}
