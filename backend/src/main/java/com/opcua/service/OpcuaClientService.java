package com.opcua.service;

import com.opcua.model.DataValueModel;
import com.opcua.model.NodeModel;
import com.opcua.provider.MockNodeProvider;
import com.opcua.simulator.DataSimulator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

@Service
public class OpcuaClientService {

    private static final Logger log = LoggerFactory.getLogger(OpcuaClientService.class);

    private final MockNodeProvider nodeProvider;
    private final DataSimulator dataSimulator;

    private final Map<String, NodeModel> nodeCache = new ConcurrentHashMap<>();
    private final Set<String> subscriptions = ConcurrentHashMap.newKeySet();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    private boolean connected = false;
    private String serverUrl = "opc.tcp://localhost:4840";

    public OpcuaClientService(MockNodeProvider nodeProvider, DataSimulator dataSimulator) {
        this.nodeProvider = nodeProvider;
        this.dataSimulator = dataSimulator;
    }

    @PostConstruct
    public void init() {
        initializeMockNodes();
        startSimulationLoop();
        connected = true;
        log.info("OPC-UA 客户端服务已初始化（模拟模式）");
    }

    private void initializeMockNodes() {
        NodeModel root = nodeProvider.buildRootNode();
        nodeProvider.cacheAllNodes(root, nodeCache);
        nodeCache.put("server", root);
    }

    private void startSimulationLoop() {
        Runnable task = dataSimulator.buildSimulationTask(nodeCache);
        scheduler.scheduleAtFixedRate(task, 1, 1, TimeUnit.SECONDS);
    }

    public List<NodeModel> browseNodes() {
        NodeModel root = nodeCache.get("server");
        return root != null ? List.of(root) : Collections.emptyList();
    }

    public DataValueModel readValue(String nodeId) {
        NodeModel node = nodeCache.get(nodeId);
        if (node == null || !"Variable".equals(node.getType())) {
            return null;
        }
        return toDataValue(node);
    }

    public boolean subscribe(String nodeId, int publishingInterval, int samplingInterval) {
        if (!nodeCache.containsKey(nodeId)) {
            log.warn("订阅失败：节点 {} 不存在", nodeId);
            return false;
        }
        subscriptions.add(nodeId);
        log.info("已订阅节点: {}, 发布间隔: {}ms, 采样间隔: {}ms", nodeId, publishingInterval, samplingInterval);
        return true;
    }

    public boolean unsubscribe(String nodeId) {
        boolean removed = subscriptions.remove(nodeId);
        if (removed) {
            log.info("已取消订阅节点: {}", nodeId);
        }
        return removed;
    }

    private DataValueModel toDataValue(NodeModel node) {
        Instant now = Instant.now();
        DataValueModel dataValue = new DataValueModel();
        dataValue.setNodeId(node.getNodeId());
        dataValue.setValue(node.getValue());
        dataValue.setQuality(node.getQuality());
        dataValue.setTimestamp(now);
        dataValue.setSourceTimestamp(now);
        dataValue.setServerTimestamp(now);
        return dataValue;
    }

    public boolean isConnected() {
        return connected;
    }

    public String getServerUrl() {
        return serverUrl;
    }
}
