
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, Sun, Activity, Battery, MapPin, Clock } from 'lucide-react';
import { getSensorData } from '@/services/imageRecognition';

type SensorData = {
  sensorId: string;
  location: string;
  temperature: number;
  humidity: number;
  lightLevel: number;
  motionDetected: boolean;
  timestamp: Date;
  batteryLevel: number;
};

type SensorInfoProps = {
  fileName?: string;
};

export default function SensorInfo({ fileName }: SensorInfoProps) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fileName) {
      loadSensorData();
    }
  }, [fileName]);

  const loadSensorData = async () => {
    setLoading(true);
    try {
      const data = await getSensorData(fileName);
      setSensorData(data);
    } catch (error) {
      console.error('Erro ao carregar dados do sensor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={20} />
            Carregando dados do sensor...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!sensorData) {
    return null;
  }

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'bg-green-500';
    if (level > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity size={20} className="text-blue-500" />
          Sensor Ativo
          <Badge variant="outline" className="ml-auto">
            {sensorData.sensorId}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Localização</p>
              <p className="text-sm font-medium">{sensorData.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Thermometer size={16} className="text-red-500" />
            <div>
              <p className="text-xs text-gray-500">Temperatura</p>
              <p className="text-sm font-medium">{sensorData.temperature}°C</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Umidade</p>
              <p className="text-sm font-medium">{sensorData.humidity}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sun size={16} className="text-yellow-500" />
            <div>
              <p className="text-xs text-gray-500">Luminosidade</p>
              <p className="text-sm font-medium">{sensorData.lightLevel}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Activity size={16} className="text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Movimento</p>
              <Badge variant={sensorData.motionDetected ? "default" : "secondary"}>
                {sensorData.motionDetected ? "Detectado" : "Não detectado"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Battery size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Bateria</p>
              <div className="flex items-center gap-1">
                <div className="w-6 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getBatteryColor(sensorData.batteryLevel)} transition-all`}
                    style={{ width: `${sensorData.batteryLevel}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{sensorData.batteryLevel}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Última leitura</p>
              <p className="text-sm font-medium">
                {sensorData.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
