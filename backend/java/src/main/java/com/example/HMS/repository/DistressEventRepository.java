package com.example.HMS.repository;

import com.example.HMS.model.DistressEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DistressEventRepository extends JpaRepository<DistressEvent, String> {
}
