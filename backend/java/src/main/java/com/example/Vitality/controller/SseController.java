package com.example.HMS.controller;

import com.example.HMS.service.SseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * SSE streaming endpoints for stats, hospital updates, and system events.
 * Lombok removed for JDK 26 compatibility.
 */
@RestController
@RequestMapping("/api/sse")
@CrossOrigin(origins = "*")
public class SseController {

    private static final Logger log = LoggerFactory.getLogger(SseController.class);

    private final SseService sseService;

    @Autowired
    public SseController(SseService sseService) {
        this.sseService = sseService;
    }

    /** City statistics stream — pushed every 2s by StatsScheduler. */
    @GetMapping(value = "/stats", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamStats() {
        log.info("New SSE connection for /stats");
        return sseService.subscribeStats();
    }

    /** Hospital state stream — pushed on any hospital change. */
    @GetMapping(value = "/hospital", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamHospital() {
        log.info("New SSE connection for /hospital");
        return sseService.subscribeHospital();
    }

    /** System events stream — patient admissions, surges, distress, redirects. */
    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEvents() {
        log.info("New SSE connection for /events");
        return sseService.subscribeEvents();
    }
}
