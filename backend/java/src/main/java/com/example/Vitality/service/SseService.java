package com.example.HMS.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Service for managing SSE connections and broadcasting real-time messages.
 * Lombok removed for JDK 26 compatibility.
 */
@Service
public class SseService {

    private static final Logger log = LoggerFactory.getLogger(SseService.class);

    private final List<SseEmitter> statsEmitters    = new CopyOnWriteArrayList<>();
    private final List<SseEmitter> hospitalEmitters = new CopyOnWriteArrayList<>();
    private final List<SseEmitter> eventsEmitters   = new CopyOnWriteArrayList<>();
    private final ObjectMapper objectMapper         = new ObjectMapper();

    public SseEmitter subscribeStats() {
        SseEmitter emitter = createEmitter(statsEmitters);
        log.info("New SSE client subscribed to stats. Total: {}", statsEmitters.size());
        return emitter;
    }

    public SseEmitter subscribeHospital() {
        SseEmitter emitter = createEmitter(hospitalEmitters);
        log.info("New SSE client subscribed to hospital. Total: {}", hospitalEmitters.size());
        return emitter;
    }

    public SseEmitter subscribeEvents() {
        SseEmitter emitter = createEmitter(eventsEmitters);
        log.info("New SSE client subscribed to events. Total: {}", eventsEmitters.size());
        return emitter;
    }

    private SseEmitter createEmitter(List<SseEmitter> emitterList) {
        SseEmitter emitter = new SseEmitter(0L); // No timeout
        emitterList.add(emitter);
        emitter.onCompletion(() -> { emitterList.remove(emitter); log.debug("SSE client disconnected"); });
        emitter.onTimeout(()    -> { emitterList.remove(emitter); log.debug("SSE client timed out"); });
        emitter.onError(e       -> { emitterList.remove(emitter); log.debug("SSE client error: {}", e.getMessage()); });
        return emitter;
    }

    public void broadcastStats(Object stats) {
        broadcast(statsEmitters, "stats", stats);
    }

    public void broadcastHospital(Object hospital) {
        broadcast(hospitalEmitters, "hospital", hospital);
    }

    public void broadcastEvent(Object event) {
        log.debug("Broadcasting event to {} clients", eventsEmitters.size());
        broadcast(eventsEmitters, "event", event);
    }

    private void broadcast(List<SseEmitter> emitters, String eventName, Object data) {
        if (emitters.isEmpty()) return;

        String jsonData;
        try {
            jsonData = objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            log.error("Failed to serialize SSE data: {}", e.getMessage());
            return;
        }

        List<SseEmitter> dead = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(jsonData));
            } catch (IOException e) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }
}
