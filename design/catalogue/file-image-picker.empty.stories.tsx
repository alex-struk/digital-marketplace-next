import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// file-image-picker · empty — a vendor editing their own profile, with no profile picture stored. A sentence stands in
// place of the picture; the chooser offers only JPEG and PNG files, and the rule and the size limit are stated before a
// file is chosen (R-8.17, R-8.30).
const meta: Meta = { title: "files/file-image-picker/empty" };
export default meta;

export const Empty: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Heading level={1}>User Profile</Heading>
        <Form validationBehavior="aria">
          <Stack gap="medium">
            <Stack role="group" aria-labelledby="picture-label" gap="small" align="start">
              <Text elementType="p" id="picture-label">Profile picture (optional)</Text>
              <Text elementType="p" size="small" color="secondary">No profile picture has been added.</Text>
              <div id="image-file-rule" data-testid="image-file-rule">
                <Text elementType="p" size="small" color="secondary">
                  A JPEG or PNG image, up to 10 MB. A picture wider or taller than 500 pixels is made smaller to fit, keeping
                  its proportions. Anyone can see your profile picture, including people who are not signed in.
                </Text>
              </div>
              <FileTrigger acceptedFileTypes={["image/jpeg", "image/png"]}>
                <Button variant="secondary" aria-describedby="image-file-rule" data-testid="change-avatar">
                  Choose a profile picture
                </Button>
              </FileTrigger>
            </Stack>
            <Text elementType="p" size="small" color="secondary">
              Sign-in username, name and email address follow. They are the users domain's design and are not shown here.
            </Text>
            <ButtonGroup ariaLabel="Profile actions">
              <Button type="submit" variant="primary">Save changes</Button>
              <Button variant="secondary">Cancel</Button>
            </ButtonGroup>
          </Stack>
        </Form>
      </Stack>
    </PageContainer>
  ),
};
