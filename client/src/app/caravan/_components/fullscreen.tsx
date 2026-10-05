import { Card, Description, Spinner } from '@heroui/react';

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner aria-label="Загрузка" />
    </div>
  );
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <Card.Header>
          <Card.Title>Каравана</Card.Title>
        </Card.Header>
        <Card.Content>
          <Description className="text-danger">{message}</Description>
        </Card.Content>
      </Card>
    </div>
  );
}
