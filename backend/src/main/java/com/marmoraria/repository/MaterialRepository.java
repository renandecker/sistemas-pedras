package com.marmoraria.repository;

import com.marmoraria.entity.Material;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class MaterialRepository implements PanacheRepositoryBase<Material, UUID> {

    public List<Material> listarAtivos() {
        return list("ativo", true);
    }
}
