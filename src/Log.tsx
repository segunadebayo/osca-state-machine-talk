function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {});
}

export function Log(props: any) {
  return (
    <pre>
      {JSON.stringify(
        pick(props.state, ["value", "nextEvents", "event", "context"]),
        null,
        2
      )}
    </pre>
  );
}
