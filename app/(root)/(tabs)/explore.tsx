import { View, Text, Button, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { generateRoute } from '../../../components/Routing';

const Explore = () => {
  const [route, setRoute] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const userSelectedIds = [1, 2, 4, 5, 6, 7, 9, 27]; // Current testing input - To be replaced by chatbot inputs later

  const handleGenerateRoute = async () => {
    setLoading(true);
    const generatedRoute = await generateRoute(userSelectedIds);
    setRoute(generatedRoute);
    setLoading(false);
  };

  return (
    <ScrollView style={{ padding: 16, backgroundColor: '#f5f5f5' }}>
      <View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
          Explore - Route Generation
        </Text>

        {/* Button to generate the route */}
        <Button title="Generate Route" onPress={handleGenerateRoute} />

        {/* Display loading spinner */}
        {loading && (
          <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 16 }} />
        )}

        {/* Display the generated route */}
        {route.length > 0 && !loading && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Your Route:</Text>
            {route.map((checkpoint, index) => (
              <Text key={index} style={{ fontSize: 14, marginVertical: 4 }}>
                {checkpoint}
              </Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default Explore;
