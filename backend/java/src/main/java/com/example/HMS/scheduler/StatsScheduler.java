package com.example.HMS.scheduler;

import com.example.HMS.service.OrchestratorService;
import com.example.HMS.service.SseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Scheduler that broadcasts real-time city statistics every 2 seconds via SSE.
 */
@Component
public class StatsScheduler {

    private static final Logger log = LoggerFactory.getLogger(StatsScheduler.class);

    private final OrchestratorService orchestratorService;
    private final SseService sseService;

    @Autowired
    public StatsScheduler(OrchestratorService orchestratorService, SseService sseService) {
        this.orchestratorService = orchestratorService;
        this.sseService = sseService;
    }

    @Scheduled(fixedRate = 2000)
    public void broadcastStats() {
        try {
            Map<String, Object> stats = orchestratorService.getCityStats();
            sseService.broadcastStats(stats);
            log.trace("Broadcasted city stats: {} hospitals, {} patients waiting",
                    stats.get("totalHospitals"), stats.get("totalPatientsWaiting"));
        } catch (Exception e) {
            log.error("Error broadcasting stats: {}", e.getMessage());
        }
    }
}
