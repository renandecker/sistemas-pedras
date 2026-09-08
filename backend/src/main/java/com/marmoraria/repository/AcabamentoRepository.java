package com.marmoraria.repository;

import com.marmoraria.entity.Acabamento;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class AcabamentoRepository implements PanacheRepositoryBase<Acabamento, UUID> {

    public List<Acabamento> listarAtivos() {
        return list("ativo", true);
    }
}
