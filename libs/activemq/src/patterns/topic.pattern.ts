export const TOPIC_BASE_PATTERN = {
  CONSUMER_SERVICE_CONTROL: 'CONSUMER_SERVICE_CONTROL',
};

const TOPIC_PATTERN = {
  CONSUMER_ACTIVEMQ_CONTROL: `VirtualTopic.CONSUMER_ACTIVEMQ_CONTROL`, 
  CONSUMER_SERVICE_CONTROL: `${TOPIC_BASE_PATTERN.CONSUMER_SERVICE_CONTROL}`,
  DEVELOPER: `DEVELOPER`
};

export const TOPIC_DESTINATION = {
  CONSUMER_SERVICE_CONTROL: `/topic/${TOPIC_PATTERN.CONSUMER_SERVICE_CONTROL}`,
  DEVELOPER : `/topic/${TOPIC_PATTERN.DEVELOPER}`
};
