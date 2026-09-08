package com.marmoraria.repository;

import com.marmoraria.entity.OrdemServico;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class OrdemServicoRepository implements PanacheRepositoryBase<OrdemServico, UUID> {

    public List<OrdemServico> listarPorFase(OrdemServico.Fase fase) {
        return list("faseAtual", fase);
    }
}
