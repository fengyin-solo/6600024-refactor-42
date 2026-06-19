package com.opcua.simulator;

import com.opcua.model.NodeModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Random;

@Component
public class DataSimulator {

    private static final Logger log = LoggerFactory.getLogger(DataSimulator.class);
    private final Random random = new Random();

    public record SimulationSpec(String nodeId, double baseValue, double range, String dataType) {}

    public static final List<SimulationSpec> DEFAULT_SPECS = List.of(
            new SimulationSpec("temp_sensor", 25.6, 2.0, "Double"),
            new SimulationSpec("pressure_transmitter", 3.45, 0.3, "Double"),
            new SimulationSpec("flow_meter", 156.7, 10.0, "Double"),
            new SimulationSpec("valve_position", 75.0, 5.0, "Double"),
            new SimulationSpec("motor_speed", 1480, 30, "Int32")
    );

    public void simulateAll(Map<String, NodeModel> nodeCache, List<SimulationSpec> specs) {
        for (SimulationSpec spec : specs) {
            simulateValue(nodeCache, spec);
        }
        occasionallyFlipPumpStatus(nodeCache);
    }

    public void simulateAllDefaults(Map<String, NodeModel> nodeCache) {
        simulateAll(nodeCache, DEFAULT_SPECS);
    }

    public void simulateValue(Map<String, NodeModel> nodeCache, SimulationSpec spec) {
        NodeModel node = nodeCache.get(spec.nodeId());
        if (node == null || !"Variable".equals(node.getType())) {
            return;
        }
        double variation = (random.nextDouble() - 0.5) * 2 * spec.range();
        if ("Int32".equals(spec.dataType())) {
            node.setValue((int) (spec.baseValue() + variation));
        } else {
            node.setValue(Math.round((spec.baseValue() + variation) * 100.0) / 100.0);
        }
        node.setQuality(random.nextDouble() > 0.97 ? "Uncertain" : "Good");
    }

    private void occasionallyFlipPumpStatus(Map<String, NodeModel> nodeCache) {
        if (random.nextDouble() <= 0.98) return;
        NodeModel pump = nodeCache.get("pump_status");
        if (pump == null) return;
        Object current = pump.getValue();
        if (current instanceof Boolean b) {
            pump.setValue(!b);
        }
    }

    public Runnable buildSimulationTask(Map<String, NodeModel> nodeCache) {
        return () -> {
            try {
                simulateAllDefaults(nodeCache);
            } catch (Exception e) {
                log.error("数据模拟异常", e);
            }
        };
    }
}
