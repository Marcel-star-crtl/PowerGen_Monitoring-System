import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Row, Col, Button, Slider, Tag, Badge } from 'antd';
import { 
  LineChartOutlined,
  ThunderboltOutlined,
  PauseOutlined,
  CaretRightOutlined
} from '@ant-design/icons';
import { 
  subscribeToTelemetry,
  startGeneratorSimulation,
  stopSimulation,
  updateSimulationParameters,
  changeSimulationSpeed
} from '../services/api';
import { updateLiveTelemetry, clearSimulationData } from '../features/simulation/simulationSlice';
import TelemetryChart from './TelemetryChart';

const RealTimeTelemetry = ({ generatorId }) => {
  const dispatch = useDispatch();
  const { telemetry, status, speed } = useSelector((state) => state.simulation);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    let unsubscribe;
    
    if (isSubscribed) {
      // Subscribe to real-time updates
      unsubscribe = subscribeToTelemetry(generatorId, (data) => {
        dispatch(updateLiveTelemetry(data));
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (!isSubscribed) {
        dispatch(clearSimulationData());
      }
    };
  }, [generatorId, isSubscribed, dispatch]);

  const handleStartSimulation = async () => {
    try {
      await dispatch(startGeneratorSimulation(generatorId)).unwrap();
      setIsSubscribed(true);
    } catch (error) {
      console.error('Failed to start simulation:', error);
    }
  };

  const handleStopSimulation = async () => {
    try {
      await dispatch(stopSimulation(generatorId)).unwrap();
      setIsSubscribed(false);
    } catch (error) {
      console.error('Failed to stop simulation:', error);
    }
  };

  const handleSpeedChange = (value) => {
    dispatch(changeSimulationSpeed(value));
  };

  return (
    <Card
      title={
        <span>
          <ThunderboltOutlined /> Generator Simulation
        </span>
      }
      extra={
        <Tag color={status === 'running' ? 'green' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      }
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div style={{ height: 400 }}>
            <TelemetryChart 
              data={telemetry} 
              showEvents 
              realTime={isSubscribed}
            />
          </div>
        </Col>
        
        <Col span={24}>
          <Row gutter={16} align="middle">
            <Col>
              {status === 'running' ? (
                <Button
                  danger
                  icon={<PauseOutlined />}
                  onClick={handleStopSimulation}
                >
                  Stop Simulation
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<CaretRightOutlined />}
                  onClick={handleStartSimulation}
                >
                  Start Simulation
                </Button>
              )}
            </Col>
            
            <Col flex="auto">
              <div style={{ padding: '0 16px' }}>
                <Slider
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={speed}
                  onChange={handleSpeedChange}
                  disabled={status !== 'running'}
                  tipFormatter={(v) => `${v}x speed`}
                />
              </div>
            </Col>
            
            <Col>
              <Badge 
                status={isSubscribed ? 'success' : 'default'} 
                text={isSubscribed ? 'Live' : 'Paused'} 
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

export default RealTimeTelemetry;