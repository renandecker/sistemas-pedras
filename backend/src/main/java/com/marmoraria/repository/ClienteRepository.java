package com.marmoraria.repository;

import com.marmoraria.entity.Cliente;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class ClienteRepository implements PanacheRepositoryBase<Cliente, UUID> {
}
