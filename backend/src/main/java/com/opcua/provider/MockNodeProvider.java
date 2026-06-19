package com.opcua.provider;

import com.opcua.model.NodeModel;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MockNodeProvider {

    public NodeModel buildRootNode() {
        NodeModel plcArea1 = createPlcArea1();
        NodeModel plcArea2 = createPlcArea2();

        NodeModel objects = new NodeModel("objects", "Objects", "ns=0;i=85", "Object", null, null, null);
        objects.setDescription("对象文件夹");
        objects.setChildren(List.of(plcArea1, plcArea2));

        NodeModel server = new NodeModel("server", "Server", "ns=0;i=2253", "Object", null, null, null);
        server.setDescription("OPC-UA 服务器根节点");
        server.setChildren(List.of(objects));

        return server;
    }

    public void cacheAllNodes(NodeModel root, Map<String, NodeModel> cache) {
        traverseAndCache(root, cache);
    }

    public List<NodeModel> collectAllNodes(NodeModel root) {
        Map<String, NodeModel> collector = new ConcurrentHashMap<>();
        traverseAndCache(root, collector);
        return List.copyOf(collector.values());
    }

    private NodeModel createPlcArea1() {
        NodeModel plcArea1 = new NodeModel("plc_area1", "PLC_Area1", "ns=2;i=1001", "Object", null, null, null);
        plcArea1.setDescription("1号生产区域 PLC");

        NodeModel tempSensor = new NodeModel("temp_sensor", "Temperature_Sensor", "ns=2;i=1002", "Variable", "Double", 25.6, "Good");
        tempSensor.setUnit("°C");
        tempSensor.setDescription("温度传感器");

        NodeModel pressureTransmitter = new NodeModel("pressure_transmitter", "Pressure_Transmitter", "ns=2;i=1003", "Variable", "Double", 3.45, "Good");
        pressureTransmitter.setUnit("MPa");
        pressureTransmitter.setDescription("压力变送器");

        NodeModel pumpStatus = new NodeModel("pump_status", "Pump_Status", "ns=2;i=1004", "Variable", "Boolean", true, "Good");
        pumpStatus.setDescription("泵运行状态");

        plcArea1.setChildren(List.of(tempSensor, pressureTransmitter, pumpStatus));
        return plcArea1;
    }

    private NodeModel createPlcArea2() {
        NodeModel plcArea2 = new NodeModel("plc_area2", "PLC_Area2", "ns=2;i=2001", "Object", null, null, null);
        plcArea2.setDescription("2号生产区域 PLC");

        NodeModel flowMeter = new NodeModel("flow_meter", "Flow_Meter", "ns=2;i=2002", "Variable", "Double", 156.7, "Good");
        flowMeter.setUnit("L/min");
        flowMeter.setDescription("流量计");

        NodeModel valvePosition = new NodeModel("valve_position", "Valve_Position", "ns=2;i=2003", "Variable", "Double", 75.0, "Good");
        valvePosition.setUnit("%");
        valvePosition.setDescription("阀门开度");

        NodeModel motorSpeed = new NodeModel("motor_speed", "Motor_Speed", "ns=2;i=2004", "Variable", "Int32", 1480, "Good");
        motorSpeed.setUnit("RPM");
        motorSpeed.setDescription("电机转速");

        plcArea2.setChildren(List.of(flowMeter, valvePosition, motorSpeed));
        return plcArea2;
    }

    private void traverseAndCache(NodeModel node, Map<String, NodeModel> cache) {
        if (node == null) return;
        cache.put(node.getId(), node);
        if (node.getChildren() != null) {
            for (NodeModel child : node.getChildren()) {
                traverseAndCache(child, cache);
            }
        }
    }
}
